import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getOwnersContent = createAsyncThunk('/owners/content', async () => {
    const { data, error } = await supabase
        .from('owners')
        .select('id, name, email, role, status, created_at')
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
})

export const updateOwnerStatus = createAsyncThunk('/owners/updateStatus', async ({ id, status }) => {
    const { data, error } = await supabase
        .from('owners')
        .update({ status })
        .eq('id', id)
        .select('id, name, email, role, status, created_at')
    
    if (error) throw error
    return data[0]
})

export const deleteOwner = createAsyncThunk('/owners/delete', async (id) => {
    const { error } = await supabase
        .from('owners')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return id
})

export const ownersSlice = createSlice({
    name: 'owners',
    initialState: {
        isLoading: false,
        owners: []
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getOwnersContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getOwnersContent.fulfilled, (state, action) => {
                state.owners = action.payload
                state.isLoading = false
            })
            .addCase(getOwnersContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(updateOwnerStatus.fulfilled, (state, action) => {
                const index = state.owners.findIndex(o => o.id === action.payload.id)
                if (index !== -1) {
                    state.owners[index] = action.payload
                }
            })
            .addCase(deleteOwner.fulfilled, (state, action) => {
                state.owners = state.owners.filter(owner => owner.id !== action.payload)
            })
    }
})

export default ownersSlice.reducer
