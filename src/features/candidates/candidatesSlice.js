import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getNeedReconnectionCandidates = createAsyncThunk('/candidates/needReconnection', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const offset = (page - 1) * limit
    const searchTerm = params?.searchTerm || ''

    // Build query based on role
    let query = supabase
        .from('contacts')
        .select(`
            *,
            profiles (*)
        `, { count: 'exact' })
        .eq('status', 'need reconnection')
        .order('contacted_at', { ascending: false })
    
    // For owners, filter by owner_id
    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }
    
    query = query.range(offset, offset + limit - 1)

    const { data: contacts, error, count } = await query
    
    if (error) throw error

    let candidates = contacts.map(contact => ({
        ...contact.profiles,
        status: contact.status,
        lastContactDate: contact.contacted_at,
        recruiterName: 'Deleted Recruiter',
        notes: contact.notes || '',
        contactId: contact.id,
        recruiterId: contact.recruiter_id,
        ownerId: contact.owner_id
    }))
    
    // Apply search filter
    if (searchTerm) {
        candidates = candidates.filter(c => 
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.headline?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }

    return { data: candidates, totalCount: count }
})

export const getCandidatesContent = createAsyncThunk('/candidates/content', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const offset = (page - 1) * limit
    const searchTerm = params?.searchTerm || ''
    const statusFilter = params?.statusFilter || ''

    if (user?.role === 'admin') {
        // Admin sees all profiles with their contact information (excluding failed)
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
                    recruiters (
                        company,
                        owner_id
                    )
                )
            `, { count: 'exact' })
            .neq('contacts.status', 'failed')
            .order('created_at', { ascending: false })
        
        // Apply search filter
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,headline.ilike.%${searchTerm}%`)
        }
        
        // Apply status filter
        if (statusFilter) {
            query = query.eq('contacts.status', statusFilter)
        }
        
        query = query.range(offset, offset + limit - 1)
        
        const { data: profiles, error: profilesError, count } = await query
        
        if (profilesError) throw profilesError

        const candidates = profiles.map(profile => {
            const latestContact = profile.contacts && profile.contacts.length > 0 
                ? profile.contacts.sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))[0]
                : null

            return {
                ...profile,
                status: latestContact?.status || 'not contacted',
                lastContactDate: latestContact?.contacted_at || profile.created_at,
                recruiterName: latestContact?.recruiters?.company || 'Unassigned',
                notes: latestContact?.notes || '',
                contactId: latestContact?.id || null
            }
        })

        return { data: candidates, totalCount: count }
    } else {
        // Owner sees only profiles contacted by their recruiters (excluding failed)
        const { data: recruiters, error: recruitersError } = await supabase
            .from('recruiters')
            .select('id')
            .eq('owner_id', user.id)
        
        if (recruitersError) throw recruitersError

        const recruiterIds = recruiters.map(r => r.id)

        if (recruiterIds.length === 0) {
            return { data: [], totalCount: 0 }
        }

        let query = supabase
            .from('contacts')
            .select(`
                *,
                profiles (*),
                recruiters (company)
            `, { count: 'exact' })
            .in('recruiter_id', recruiterIds)
            .neq('status', 'failed')
            .order('contacted_at', { ascending: false })
        
        // Apply status filter
        if (statusFilter) {
            query = query.eq('status', statusFilter)
        }
        
        query = query.range(offset, offset + limit - 1)
        
        const { data: contacts, error: contactsError, count } = await query
        
        if (contactsError) throw contactsError

        let candidates = contacts.map(contact => {
            const profile = contact.profiles
            return {
                ...profile,
                status: contact.status,
                lastContactDate: contact.contacted_at,
                recruiterName: contact.recruiters?.company || 'Unknown',
                notes: contact.notes || '',
                contactId: contact.id
            }
        })
        
        // Apply search filter on client side for owner (since we can't do it in the query easily)
        if (searchTerm) {
            candidates = candidates.filter(c => 
                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.headline?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        return { data: candidates, totalCount: count }
    }
})

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

    // For owners, verify they have contacted this candidate
    if (user?.role === 'owner') {
        // Get recruiter IDs for this owner
        const { data: recruiters } = await supabase
            .from('recruiters')
            .select('id')
            .eq('owner_id', user.id)
        
        const recruiterIds = recruiters?.map(r => r.id) || []

        // Check if any of their recruiters contacted this profile
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

// Update contact status (for reconnecting candidates)
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
            let { newCandidateObj } = action.payload
            state.candidates = [newCandidateObj, ...state.candidates]
        },

        deleteCandidate: (state, action) => {
            let { id } = action.payload
            state.candidates = state.candidates.filter(candidate => candidate.id !== id)
            state.needReconnection = state.needReconnection.filter(candidate => candidate.id !== id)
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(getCandidatesContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getCandidatesContent.fulfilled, (state, action) => {
                state.candidates = action.payload.data
                state.totalCount = action.payload.totalCount
                state.isLoading = false
            })
            .addCase(getCandidatesContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(getNeedReconnectionCandidates.fulfilled, (state, action) => {
                state.needReconnection = action.payload.data
                state.needReconnectionTotalCount = action.payload.totalCount
            })
            .addCase(addCandidateToDb.fulfilled, (state, action) => {
                state.candidates = [action.payload, ...state.candidates]
            })
            .addCase(deleteCandidateFromDb.fulfilled, (state, action) => {
                state.candidates = state.candidates.filter(candidate => candidate.id !== action.payload)
                state.needReconnection = state.needReconnection.filter(candidate => candidate.id !== action.payload)
            })
    }
})

export const { addNewCandidate, deleteCandidate } = candidatesSlice.actions

export default candidatesSlice.reducer
