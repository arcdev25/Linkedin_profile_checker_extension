import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getAccountsContent = createAsyncThunk('/accounts/content', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    let query = supabase
        .from('recruiters')
        .select('*')
        .order('created_at', { ascending: false })
    
    // If user is owner (not admin), filter by owner_id
    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }
    // Admin sees all recruiters
    
    const { data, error } = await query
    
    if (error) throw error
    return data
})

export const addAccountToDb = createAsyncThunk('/accounts/add', async (accountObj, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Add owner_id to the account object
    const accountWithOwner = {
        ...accountObj,
        owner_id: user.id
    }

    const { data, error } = await supabase
        .from('recruiters')
        .insert([accountWithOwner])
        .select()
    
    if (error) throw error
    return data[0]
})

export const updateAccountInDb = createAsyncThunk('/accounts/update', async ({ id, updates }, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Verify ownership before update (for owners)
    if (user?.role === 'owner') {
        const { data: existing } = await supabase
            .from('recruiters')
            .select('owner_id')
            .eq('id', id)
            .single()
        
        if (existing?.owner_id !== user.id) {
            throw new Error('You can only edit your own recruiters')
        }
    }

    const { data, error } = await supabase
        .from('recruiters')
        .update(updates)
        .eq('id', id)
        .select()
    
    if (error) throw error
    return data[0]
})

export const deleteAccountFromDb = createAsyncThunk('/accounts/delete', async (id, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Verify ownership before delete (for owners)
    if (user?.role === 'owner') {
        const { data: existing } = await supabase
            .from('recruiters')
            .select('owner_id')
            .eq('id', id)
            .single()
        
        if (existing?.owner_id !== user.id) {
            throw new Error('You can only delete your own recruiters')
        }
    }

    const { error } = await supabase
        .from('recruiters')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return id
})

export const accountsSlice = createSlice({
    name: 'accounts',
    initialState: {
        isLoading: false,
        accounts: []
    },
    reducers: {
        addNewAccount: (state, action) => {
            let { newAccountObj } = action.payload
            state.accounts = [newAccountObj, ...state.accounts]
        },

        deleteAccount: (state, action) => {
            let { id } = action.payload
            state.accounts = state.accounts.filter(account => account.id !== id)
        },

        updateAccount: (state, action) => {
            let { id, updates } = action.payload
            const index = state.accounts.findIndex(a => a.id === id)
            if (index !== -1) {
                state.accounts[index] = { ...state.accounts[index], ...updates }
            }
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAccountsContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getAccountsContent.fulfilled, (state, action) => {
                state.accounts = action.payload
                state.isLoading = false
            })
            .addCase(getAccountsContent.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(addAccountToDb.fulfilled, (state, action) => {
                state.accounts = [action.payload, ...state.accounts]
            })
            .addCase(updateAccountInDb.fulfilled, (state, action) => {
                const index = state.accounts.findIndex(a => a.id === action.payload.id)
                if (index !== -1) {
                    state.accounts[index] = action.payload
                }
            })
            .addCase(deleteAccountFromDb.fulfilled, (state, action) => {
                state.accounts = state.accounts.filter(account => account.id !== action.payload)
            })
    }
})

export const { addNewAccount, deleteAccount, updateAccount } = accountsSlice.actions

export default accountsSlice.reducer