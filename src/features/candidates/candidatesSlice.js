import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'
import moment from 'moment'

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
    const noteSearch = params?.noteSearch || ''

    // Query from contacts table so count is accurate
    let query = supabase
        .from('contacts')
        .select(`
            id,
            status,
            notes,
            contacted_at,
            recruiter_id,
            owner_id,
            profiles!inner (
                id,
                linkedin_id,
                name,
                headline,
                profile_url,
                avatar_url,
                country,
                created_at
            ),
            recruiters (
                id,
                name,
                company,
                deleted_at,
                deleted_name
            )
        `, { count: 'exact' })
        .eq('status', 'need reconnection')
        .order('contacted_at', { ascending: false })

    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }

    if (searchTerm) {
        query = query.or(
            `profiles.name.ilike.%${searchTerm}%,profiles.headline.ilike.%${searchTerm}%,profiles.profile_url.ilike.%${searchTerm}%`,
            { foreignTable: 'profiles' }
        )
    }

    if (noteSearch) {
        query = query.ilike('notes', `%${noteSearch}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: contacts, error, count } = await query
    if (error) throw error

    const candidates = (contacts || []).map(contact => {
        const profile   = contact.profiles
        const recruiter = contact.recruiters

        const recruiterName = recruiter
            ? (recruiter.deleted_at
                ? `${recruiter.company || recruiter.deleted_name || 'Deleted'} (deleted)`
                : (recruiter.company || recruiter.name || 'N/A'))
            : 'N/A'

        return {
            ...(profile || {}),
            status:          contact.status || 'need reconnection',
            lastContactDate: contact.contacted_at || profile?.created_at,
            recruiterName,
            notes:           contact.notes || '',
            contactId:       contact.id || null,
            recruiterId:     contact.recruiter_id,
            ownerId:         contact.owner_id,
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
    const noteSearch    = params?.noteSearch    || ''
    const statusFilter  = params?.statusFilter  || ''
    const companyFilter = params?.companyFilter || ''
    const ownerFilter   = params?.ownerFilter   || null  // admin: filter by specific owner_id

    // ── Resolve recruiter IDs for owner ──────────────────────────────────────
    let recruiterIds = null   // null = no restriction (admin, all owners)
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

    // Admin scoped to a specific owner: resolve that owner's recruiter IDs
    if (user?.role === 'admin' && ownerFilter) {
        const { data: recruiters, error: rErr } = await supabase
            .from('recruiters')
            .select('id, company')
            .eq('owner_id', ownerFilter)

        if (rErr) throw rErr

        const filtered = companyFilter
            ? (recruiters || []).filter(r => (r.company || '').toLowerCase().includes(companyFilter.toLowerCase()))
            : (recruiters || [])

        recruiterIds = filtered.map(r => r.id)
        filtered.forEach(r => { recruiterCompanyMap[r.id] = r.company })

        if (recruiterIds.length === 0) return { data: [], totalCount: 0 }
    }

    // ── Query from contacts table (accurate count + filtering on contact columns) ──
    let query = supabase
        .from('contacts')
        .select(`
            id,
            status,
            notes,
            contacted_at,
            recruiter_id,
            owner_id,
            profiles!inner (
                id,
                linkedin_id,
                name,
                headline,
                profile_url,
                avatar_url,
                country,
                created_at
            ),
            recruiters (
                id,
                company
            )
        `, { count: 'exact' })
        .neq('status', 'failed')
        .order('contacted_at', { ascending: false })

    // Status filter
    if (statusFilter) {
        query = query.eq('status', statusFilter)
    }

    // Owner scope — restrict to specific recruiters
    if (recruiterIds !== null) {
        query = query.in('recruiter_id', recruiterIds)
    }

    // Company filter for admin (no specific owner selected) — filter via joined recruiters
    if (user?.role === 'admin' && !ownerFilter && companyFilter) {
        query = query.ilike('recruiters.company', `%${companyFilter}%`)
    }

    // Search on profile fields via the join
    if (searchTerm) {
        query = query.or(
            `profiles.name.ilike.%${searchTerm}%,profiles.headline.ilike.%${searchTerm}%,profiles.profile_url.ilike.%${searchTerm}%`,
            { foreignTable: 'profiles' }
        )
    }

    // Note search on contacts.notes (base table column — works directly)
    if (noteSearch) {
        query = query.ilike('notes', `%${noteSearch}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: contacts, error, count } = await query
    if (error) throw error

    const candidates = (contacts || []).map(contact => {
        const profile = contact.profiles

        const company = contact.recruiters?.company
            || recruiterCompanyMap[contact.recruiter_id]
            || 'Unassigned'

        return {
            ...(profile || {}),
            status:          contact.status || 'not contacted',
            lastContactDate: contact.contacted_at || profile?.created_at,
            recruiterName:   company,
            notes:           contact.notes || '',
            contactId:       contact.id || null,
            recruiterId:     contact.recruiter_id,
            ownerId:         contact.owner_id,
        }
    })

    return { data: candidates, totalCount: count || 0 }
})

// ─── CSV Download — fetches ALL matching records (no pagination limit) ───────

export const downloadCandidatesCSV = createAsyncThunk('/candidates/download', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    const searchTerm    = params?.searchTerm    || ''
    const noteSearch    = params?.noteSearch    || ''
    const statusFilter  = params?.statusFilter  || ''
    const companyFilter = params?.companyFilter || ''
    const activeTab     = params?.activeTab     || 'main'
    const PAGE_SIZE     = 1000

    let recruiterIds        = null
    let recruiterCompanyMap = {}

    if (user?.role === 'owner') {
        const { data: recruiters, error: rErr } = await supabase
            .from('recruiters')
            .select('id, company')
            .eq('owner_id', user.id)
        if (rErr) throw rErr
        if (!recruiters || recruiters.length === 0) return []

        let filtered = recruiters
        if (companyFilter) {
            filtered = recruiters.filter(r =>
                (r.company || '').toLowerCase().includes(companyFilter.toLowerCase())
            )
        }
        recruiterIds = filtered.map(r => r.id)
        filtered.forEach(r => { recruiterCompanyMap[r.id] = r.company })
    }

    // Build the base query — contacts is the base table for accurate results
    const buildQuery = (from) => {
        if (activeTab === 'reconnection') {
            let q = supabase
                .from('contacts')
                .select(`
                    id, status, notes, contacted_at, recruiter_id, owner_id,
                    profiles!inner ( id, name, headline, profile_url, avatar_url, country, created_at ),
                    recruiters ( id, name, company, deleted_at, deleted_name )
                `)
                .eq('status', 'need reconnection')
                .order('contacted_at', { ascending: false })
            if (user?.role === 'owner') q = q.eq('owner_id', user.id)
            if (searchTerm) q = q.or(
                `profiles.name.ilike.%${searchTerm}%,profiles.headline.ilike.%${searchTerm}%,profiles.profile_url.ilike.%${searchTerm}%`,
                { foreignTable: 'profiles' }
            )
            if (noteSearch) q = q.ilike('notes', `%${noteSearch}%`)
            return q.range(from, from + PAGE_SIZE - 1)
        }

        let q = supabase
            .from('contacts')
            .select(`
                id, status, notes, contacted_at, recruiter_id, owner_id,
                profiles!inner ( id, name, headline, profile_url, avatar_url, country, created_at ),
                recruiters ( company )
            `)
            .neq('status', 'failed')
            .order('contacted_at', { ascending: false })

        if (statusFilter) q = q.eq('status', statusFilter)
        if (recruiterIds !== null) q = q.in('recruiter_id', recruiterIds)
        if (user?.role === 'admin' && companyFilter) q = q.ilike('recruiters.company', `%${companyFilter}%`)
        if (searchTerm) q = q.or(
            `profiles.name.ilike.%${searchTerm}%,profiles.headline.ilike.%${searchTerm}%,profiles.profile_url.ilike.%${searchTerm}%`,
            { foreignTable: 'profiles' }
        )
        if (noteSearch) q = q.ilike('notes', `%${noteSearch}%`)
        return q.range(from, from + PAGE_SIZE - 1)
    }

    // Paginate through all results
    let allContacts = []
    let from = 0
    while (true) {
        const { data, error } = await buildQuery(from)
        if (error) throw error
        allContacts = allContacts.concat(data || [])
        if (!data || data.length < PAGE_SIZE) break
        from += PAGE_SIZE
    }

    // Map to flat rows
    return allContacts.map(contact => {
        const profile = contact.profiles

        let company = 'Unassigned'
        if (activeTab === 'reconnection') {
            const rec = contact.recruiters
            company = rec
                ? (rec.deleted_at
                    ? `${rec.company || rec.deleted_name || 'Deleted'} (deleted)`
                    : (rec.company || rec.name || 'N/A'))
                : 'N/A'
        } else {
            company = contact.recruiters?.company
                || recruiterCompanyMap[contact.recruiter_id]
                || 'Unassigned'
        }

        return {
            name:         profile?.name        || '',
            headline:     profile?.headline    || '',
            profile_url:  profile?.profile_url || '',
            country:      profile?.country     || '',
            status:       contact.status       || '',
            company,
            notes:        contact.notes        || '',
            last_contact: contact.contacted_at ? moment(contact.contacted_at).format('YYYY-MM-DD HH:mm') : '',
        }
    })
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

// Delete only the specific contact row (used from Need Reconnection tab)
// This does NOT delete the profile, so the candidate stays in the main list
export const deleteReconnectionContact = createAsyncThunk('/candidates/deleteReconnectionContact', async (contactId, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Verify ownership for owners
    if (user?.role === 'owner') {
        const { data: contact } = await supabase
            .from('contacts')
            .select('owner_id')
            .eq('id', contactId)
            .single()

        if (contact?.owner_id !== user.id) {
            throw new Error('You can only delete your own contacts')
        }
    }

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

    if (error) throw error
    return contactId
})

export const updateContactStatus = createAsyncThunk('/candidates/updateContact', async ({ contactId, newStatus }) => {
    const { data, error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
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
            .addCase(deleteReconnectionContact.fulfilled, (state, action) => {
                // Remove only from the reconnection list by contactId — main candidates untouched
                state.needReconnection = state.needReconnection.filter(c => c.contactId !== action.payload)
                state.needReconnectionTotalCount = Math.max(0, state.needReconnectionTotalCount - 1)
            })
            .addCase(updateContactStatus.fulfilled, (state, action) => {
                const updated = action.payload
                if (!updated) return
                // Only update the status field — preserve all other candidate data (recruiterName etc.)
                state.candidates = state.candidates.map(c =>
                    c.contactId === updated.id ? { ...c, status: updated.status } : c
                )
                state.needReconnection = state.needReconnection.map(c =>
                    c.contactId === updated.id ? { ...c, status: updated.status } : c
                )
            })
    }
})

export const { addNewCandidate, deleteCandidate } = candidatesSlice.actions
export default candidatesSlice.reducer
