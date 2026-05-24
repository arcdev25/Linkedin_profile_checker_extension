import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

// ─── helpers ────────────────────────────────────────────────────────────────

// Build the owner-scoping filter string for contacts.or()
const ownerOrClause = (recruiterIds, ownerId) => {
    const parts = [`owner_id.eq.${ownerId}`]
    if (recruiterIds.length > 0) {
        parts.push(`recruiter_id.in.(${recruiterIds.join(',')})`)
    }
    return parts.join(',')
}

// ─── Need Reconnection ───────────────────────────────────────────────────────

export const getNeedReconnectionCandidates = createAsyncThunk('/candidates/needReconnection', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    const page       = params?.page       || 1
    const limit      = params?.limit      || 10
    const offset     = (page - 1) * limit
    const searchTerm = params?.searchTerm || ''

    // Query from profiles so we can search profile columns directly
    let query = supabase
        .from('profiles')
        .select(`
            *,
            contacts!inner (
                id,
                status,
                notes,
                contacted_at,
                recruiter_id,
                owner_id
            )
        `, { count: 'exact' })
        .eq('contacts.status', 'need reconnection')
        .order('created_at', { ascending: false })

    if (user?.role === 'owner') {
        query = query.eq('contacts.owner_id', user.id)
    }

    if (searchTerm) {
        query = query.or(
            `name.ilike.%${searchTerm}%,headline.ilike.%${searchTerm}%,profile_url.ilike.%${searchTerm}%`
        )
    }

    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error, count } = await query
    if (error) throw error

    const candidates = (profiles || []).map(profile => {
        const contact = Array.isArray(profile.contacts)
            ? profile.contacts.sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))[0]
            : profile.contacts
        return {
            ...profile,
            status: contact?.status || 'need reconnection',
            lastContactDate: contact?.contacted_at || profile.created_at,
            recruiterName: 'N/A',
            notes: contact?.notes || '',
            contactId: contact?.id || null,
            recruiterId: contact?.recruiter_id,
            ownerId: contact?.owner_id
        }
    })

    return { data: candidates, totalCount: count || 0 }
})

// ─── Main Candidates ─────────────────────────────────────────────────────────

export const getCandidatesContent = createAsyncThunk('/candidates/content', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    const page          = params?.page          || 1
    const limit         = params?.limit         || 10
    const offset        = (page - 1) * limit
    const searchTerm    = params?.searchTerm    || ''
    const statusFilter  = params?.statusFilter  || ''
    const companyFilter = params?.companyFilter || ''

    // ── Resolve recruiter IDs for owner ──────────────────────────────────────
    let recruiterIds = null   // null = no restriction (admin)
    let recruiterCompanyMap = {}

    if (user?.role === 'owner') {
        const { data: recruiters, error: rErr } = await supabase
            .from('recruiters')
            .select('id, company')
            .eq('owner_id', user.id)

        if (rErr) throw rErr
        if (!recruiters || recruiters.length === 0) return { data: [], totalCount: 0 }

        let filtered = recruiters
        if (companyFilter) {
            filtered = recruiters.filter(r =>
                (r.company || '').toLowerCase().includes(companyFilter.toLowerCase())
            )
            if (filtered.length === 0) return { data: [], totalCount: 0 }
        }

        recruiterIds = filtered.map(r => r.id)
        filtered.forEach(r => { recruiterCompanyMap[r.id] = r.company })
    }

    // ── Query from profiles table so search works on profile columns ──────────
    let query = supabase
        .from('profiles')
        .select(`
            *,
            contacts!inner (
                id,
                status,
                notes,
                contacted_at,
                recruiter_id,
                owner_id,
                recruiters (company)
            )
        `, { count: 'exact' })
        .neq('contacts.status', 'failed')
        .order('created_at', { ascending: false })

    // Status filter
    if (statusFilter) {
        query = query.eq('contacts.status', statusFilter)
    }

    // Owner scope — restrict to their recruiters
    if (recruiterIds !== null) {
        query = query.in('contacts.recruiter_id', recruiterIds)
    }

    // Company filter for admin (filter via joined recruiters)
    if (user?.role === 'admin' && companyFilter) {
        query = query.ilike('contacts.recruiters.company', `%${companyFilter}%`)
    }

    // Search: name, headline, profile_url — all on the profiles table (base table)
    if (searchTerm) {
        query = query.or(
            `name.ilike.%${searchTerm}%,headline.ilike.%${searchTerm}%,profile_url.ilike.%${searchTerm}%`
        )
    }

    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error, count } = await query
    if (error) throw error

    const candidates = (profiles || []).map(profile => {
        const contactList = Array.isArray(profile.contacts) ? profile.contacts : [profile.contacts].filter(Boolean)
        const latestContact = contactList.sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))[0]

        const company = latestContact?.recruiters?.company
            || recruiterCompanyMap[latestContact?.recruiter_id]
            || 'Unassigned'

        return {
            ...profile,
            status: latestContact?.status || 'not contacted',
            lastContactDate: latestContact?.contacted_at || profile.created_at,
            recruiterName: company,
            notes: latestContact?.notes || '',
            contactId: latestContact?.id || null
        }
    })

    return { data: candidates, totalCount: count || 0 }
})

// ─── Add / Delete / Update ───────────────────────────────────────────────────

export const addCandidateToDb = createAsyncThunk('/candidates/add', async (candidateObj) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert([candidateObj])
        .select()
    if (error) throw error
    return data[0]
})

export const deleteCandidateFromDb = createAsyncThunk('/candidates/delete', async (id, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    if (user?.role === 'owner') {
        const { data: recruiters } = await supabase
            .from('recruiters')
            .select('id')
            .eq('owner_id', user.id)

        const recruiterIds = recruiters?.map(r => r.id) || []

        const { data: contacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('profile_id', id)
            .in('recruiter_id', recruiterIds)

        if (!contacts || contacts.length === 0) {
            throw new Error('You can only delete candidates you have contacted')
        }
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
    if (error) throw error
    return id
})

export const updateContactStatus = createAsyncThunk('/candidates/updateContact', async ({ contactId, newStatus, recruiterId }) => {
    const { data, error } = await supabase
        .from('contacts')
        .update({
            status: newStatus,
            recruiter_id: recruiterId,
            contacted_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select()
    if (error) throw error
    return data[0]
})

// ─── Slice ───────────────────────────────────────────────────────────────────

export const candidatesSlice = createSlice({
    name: 'candidates',
    initialState: {
        isLoading: false,
        candidates: [],
        needReconnection: [],
        totalCount: 0,
        needReconnectionTotalCount: 0
    },
    reducers: {
        addNewCandidate: (state, action) => {
            state.candidates = [action.payload.newCandidateObj, ...state.candidates]
        },
        deleteCandidate: (state, action) => {
            const { id } = action.payload
            state.candidates      = state.candidates.filter(c => c.id !== id)
            state.needReconnection = state.needReconnection.filter(c => c.id !== id)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCandidatesContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getCandidatesContent.fulfilled, (state, action) => {
                state.candidates  = action.payload.data
                state.totalCount  = action.payload.totalCount
                state.isLoading   = false
            })
            .addCase(getCandidatesContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(getNeedReconnectionCandidates.fulfilled, (state, action) => {
                state.needReconnection          = action.payload.data
                state.needReconnectionTotalCount = action.payload.totalCount
            })
            .addCase(addCandidateToDb.fulfilled, (state, action) => {
                state.candidates = [action.payload, ...state.candidates]
            })
            .addCase(deleteCandidateFromDb.fulfilled, (state, action) => {
                state.candidates      = state.candidates.filter(c => c.id !== action.payload)
                state.needReconnection = state.needReconnection.filter(c => c.id !== action.payload)
            })
    }
})

export const { addNewCandidate, deleteCandidate } = candidatesSlice.actions
export default candidatesSlice.reducer
