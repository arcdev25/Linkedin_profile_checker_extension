import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getFailedCandidatesContent = createAsyncThunk('/failedCandidates/content', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    if (user?.role === 'admin') {
        // Admin sees all failed candidates
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select(`
                *,
                profiles (*),
                recruiters (name, owner_id)
            `)
            .eq('status', 'failed')
            .order('contacted_at', { ascending: false })
        
        if (error) throw error

        const candidates = contacts.map(contact => ({
            ...contact.profiles,
            status: contact.status,
            lastContactDate: contact.contacted_at,
            recruiterName: contact.recruiters?.name || 'Unknown',
            notes: contact.notes || '',
            contactId: contact.id
        }))

        return candidates
    } else {
        // Owner sees only their failed candidates
        const { data: recruiters, error: recruitersError } = await supabase
            .from('recruiters')
            .select('id')
            .eq('owner_id', user.id)
        
        if (recruitersError) throw recruitersError

        const recruiterIds = recruiters.map(r => r.id)

        if (recruiterIds.length === 0) {
            return []
        }

        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select(`
                *,
                profiles (*),
                recruiters (name)
            `)
            .in('recruiter_id', recruiterIds)
            .eq('status', 'failed')
            .order('contacted_at', { ascending: false })
        
        if (contactsError) throw contactsError

        const candidates = contacts.map(contact => ({
            ...contact.profiles,
            status: contact.status,
            lastContactDate: contact.contacted_at,
            recruiterName: contact.recruiters?.name || 'Unknown',
            notes: contact.notes || '',
            contactId: contact.id
        }))

        return candidates
    }
})

export const deleteFailedCandidateFromDb = createAsyncThunk('/failedCandidates/delete', async (id, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // For owners, verify they have contacted this candidate
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

export const failedCandidatesSlice = createSlice({
    name: 'failedCandidates',
    initialState: {
        isLoading: false,
        candidates: []
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getFailedCandidatesContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getFailedCandidatesContent.fulfilled, (state, action) => {
                state.candidates = action.payload
                state.isLoading = false
            })
            .addCase(getFailedCandidatesContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(deleteFailedCandidateFromDb.fulfilled, (state, action) => {
                state.candidates = state.candidates.filter(candidate => candidate.id !== action.payload)
            })
    }
})

export default failedCandidatesSlice.reducer
