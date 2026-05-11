import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getFailedCandidatesContent = createAsyncThunk('/failedCandidates/content', async (params, { getState }) => {
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
            profiles (*),
            recruiters (company)
        `, { count: 'exact' })
        .eq('status', 'failed')
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
        country: contact.profiles?.country,
        status: contact.status,
        lastContactDate: contact.contacted_at,
        recruiterName: contact.recruiters?.company || 'Deleted Recruiter',
        notes: contact.notes || '',
        contactId: contact.id
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
        candidates: [],
        totalCount: 0
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getFailedCandidatesContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getFailedCandidatesContent.fulfilled, (state, action) => {
                state.candidates = action.payload.data
                state.totalCount = action.payload.totalCount
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
