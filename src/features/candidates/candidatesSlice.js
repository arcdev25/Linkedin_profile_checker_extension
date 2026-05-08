import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

// Get candidates that need reconnection (recruiter was deleted)
export const getNeedReconnectionCandidates = createAsyncThunk('/candidates/needReconnection', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Build query based on role
    let query = supabase
        .from('contacts')
        .select(`
            *,
            profiles (*)
        `)
        .eq('status', 'need reconnection')
        .order('contacted_at', { ascending: false })
    
    // For owners, filter by owner_id
    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }

    const { data: contacts, error } = await query
    
    if (error) throw error

    const candidates = contacts.map(contact => ({
        ...contact.profiles,
        status: contact.status,
        lastContactDate: contact.contacted_at,
        recruiterName: 'Deleted Recruiter',
        notes: contact.notes || '',
        contactId: contact.id,
        recruiterId: contact.recruiter_id,
        ownerId: contact.owner_id
    }))

    return candidates
})

export const getCandidatesContent = createAsyncThunk('/candidates/content', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    if (user?.role === 'admin') {
        // Admin sees all profiles with their contact information (excluding failed)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`
                *,
                contacts (
                    id,
                    status,
                    notes,
                    contacted_at,
                    recruiter_id,
                    recruiters (
                        name,
                        owner_id
                    )
                )
            `)
            .order('created_at', { ascending: false })
        
        if (profilesError) throw profilesError

        const candidates = profiles.map(profile => {
            const latestContact = profile.contacts && profile.contacts.length > 0 
                ? profile.contacts.sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))[0]
                : null

            return {
                ...profile,
                status: latestContact?.status || 'not contacted',
                lastContactDate: latestContact?.contacted_at || profile.created_at,
                recruiterName: latestContact?.recruiters?.name || 'Unassigned',
                notes: latestContact?.notes || '',
                contactId: latestContact?.id || null
            }
        }).filter(c => c.status !== 'failed') // Exclude failed candidates

        return candidates
    } else {
        // Owner sees only profiles contacted by their recruiters (excluding failed)
        // First, get all recruiter IDs for this owner
        const { data: recruiters, error: recruitersError } = await supabase
            .from('recruiters')
            .select('id')
            .eq('owner_id', user.id)
        
        if (recruitersError) throw recruitersError

        const recruiterIds = recruiters.map(r => r.id)

        if (recruiterIds.length === 0) {
            // No recruiters, no candidates
            return []
        }

        // Get all contacts made by these recruiters (excluding failed)
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select(`
                *,
                profiles (*),
                recruiters (name)
            `)
            .in('recruiter_id', recruiterIds)
            .neq('status', 'failed')
            .order('contacted_at', { ascending: false })
        
        if (contactsError) throw contactsError

        // Group contacts by profile_id and get the latest contact for each profile
        const profileMap = new Map()
        
        contacts.forEach(contact => {
            const profileId = contact.profile_id
            if (!profileMap.has(profileId) || 
                new Date(contact.contacted_at) > new Date(profileMap.get(profileId).contacted_at)) {
                profileMap.set(profileId, contact)
            }
        })

        // Transform to candidates format
        const candidates = Array.from(profileMap.values()).map(contact => {
            const profile = contact.profiles
            return {
                ...profile,
                status: contact.status,
                lastContactDate: contact.contacted_at,
                recruiterName: contact.recruiters?.name || 'Unknown',
                notes: contact.notes || '',
                contactId: contact.id
            }
        })

        return candidates
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
        needReconnection: []
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
                state.candidates = action.payload
                state.isLoading = false
            })
            .addCase(getCandidatesContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(getNeedReconnectionCandidates.fulfilled, (state, action) => {
                state.needReconnection = action.payload
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
