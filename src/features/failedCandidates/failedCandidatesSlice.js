import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getFailedCandidatesContent = createAsyncThunk('/failedCandidates/content', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Build query based on role
    let query = supabase
        .from('contacts')
        .select(`
            *,
            profiles (*),
            recruiters (name)
        `)
        .eq('status', 'failed')
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
        recruiterName: contact.recruiters?.name || 'Deleted Recruiter',
        notes: contact.notes || '',
        contactId: contact.id
    }))

    return candidates
})

export const deleteFailedCandidateFromDb = createAsyncThunk('/failedCandidates/delete', async (id, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // For owners, verify they own this candidate
    if (user?.role === 'owner') {
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, owner_id')
            .eq('profile_id', id)
            .eq('owner_id', user.id)
        
        if (!contacts || contacts.length === 0) {
            throw new Error('You can only delete your own candidates')
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
