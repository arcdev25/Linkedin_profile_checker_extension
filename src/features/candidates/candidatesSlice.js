import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getCandidatesContent = createAsyncThunk('/candidates/content', async () => {
    // Fetch profiles with their contact information
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
                    name
                )
            )
        `)
        .order('created_at', { ascending: false })
    
    if (profilesError) throw profilesError

    // Transform data to include latest contact info
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
    })

    return candidates
})

export const addCandidateToDb = createAsyncThunk('/candidates/add', async (candidateObj) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert([candidateObj])
        .select()
    
    if (error) throw error
    return data[0]
})

export const deleteCandidateFromDb = createAsyncThunk('/candidates/delete', async (id) => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return id
})

export const candidatesSlice = createSlice({
    name: 'candidates',
    initialState: {
        isLoading: false,
        candidates: []
    },
    reducers: {
        addNewCandidate: (state, action) => {
            let { newCandidateObj } = action.payload
            state.candidates = [newCandidateObj, ...state.candidates]
        },

        deleteCandidate: (state, action) => {
            let { id } = action.payload
            state.candidates = state.candidates.filter(candidate => candidate.id !== id)
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
            .addCase(addCandidateToDb.fulfilled, (state, action) => {
                state.candidates = [action.payload, ...state.candidates]
            })
            .addCase(deleteCandidateFromDb.fulfilled, (state, action) => {
                state.candidates = state.candidates.filter(candidate => candidate.id !== action.payload)
            })
    }
})

export const { addNewCandidate, deleteCandidate } = candidatesSlice.actions

export default candidatesSlice.reducer
