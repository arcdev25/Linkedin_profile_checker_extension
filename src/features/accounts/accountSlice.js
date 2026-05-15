import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getAccountsContent = createAsyncThunk('/accounts/content', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const ownerId = params?.ownerId
    const offset = (page - 1) * limit
    const isAdmin = user?.role === 'admin'
    // Determine which owner's data to fetch. Admins can pass null for all owners.
    let targetOwnerId = isAdmin ? ownerId : user?.id
     // If user is owner (not admin), always use their own ID
    if (user?.role === 'owner') {
        targetOwnerId = user.id
    }


    let query = supabase
        .from('recruiters')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    
    if (targetOwnerId) {
        query = query.eq('owner_id', targetOwnerId)
    }    
    // If user is owner (not admin), filter by owner_id
    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }
    // Admin sees all recruiters
    
    const { data, error, count } = await query
    
    if (error) throw error
    return { data, totalCount: count }
})

// Get all owners for admin tabs
export const getAllOwners = createAsyncThunk('/account/owners', async () => {
    const { data, error } = await supabase
        .from('owners')
        .select('id, name, email, role')
        .eq('role', 'owner')
        .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
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

    // Get recruiter info before deleting
    const { data: recruiter } = await supabase
        .from('recruiters')
        .select('owner_id')
        .eq('id', id)
        .single()

    // Verify ownership before delete (for owners)
    if (user?.role === 'owner') {
        if (recruiter?.owner_id !== user.id) {
            throw new Error('You can only delete your own recruiters')
        }
    }

    // Update ALL contacts for this recruiter to preserve owner_id
    // This includes both "need reconnection" and "failed" candidates
    const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
            owner_id: recruiter?.owner_id // Preserve owner_id for all contacts
        })
        .eq('recruiter_id', id)
    
    if (updateError) throw updateError

    // Update non-failed contacts to "need reconnection"
    const { error: statusError } = await supabase
        .from('contacts')
        .update({ 
            status: 'need reconnection'
        })
        .eq('recruiter_id', id)
        .neq('status', 'failed') // Don't change failed candidates' status
    
    if (statusError) throw statusError

    // Now delete the recruiter
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
        accounts: [],
        owners: [],
        totalCount: 0
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
        },
        setSelectedOwner: (state, action) => {
            state.selectedOwnerId = action.payload
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAccountsContent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getAccountsContent.fulfilled, (state, action) => {
                state.accounts = action.payload.data
                state.totalCount = action.payload.totalCount
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
            .addCase(getAllOwners.fulfilled, (state, action) => {
                            state.owners = action.payload
                        })
    }
})

export const { addNewAccount, deleteAccount, updateAccount, setSelectedOwner } = accountsSlice.actions

export default accountsSlice.reducer