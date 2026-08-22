import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

// Owner permission mapping — defines which owners can see other owners' data
const OWNER_PERMISSIONS = {
    'Yura@owner.com': ['Faker@owner.com', '0xGiant@owner.com'],
    'Rape@owner.com': ['0xStrong@owner.com', 'Voldmot@owner.com']
}

export const getAccountsContent = createAsyncThunk('/accounts/content', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const ownerId = params?.ownerId
    const searchTerm = params?.searchTerm || ''
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
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (targetOwnerId) {
        query = query.eq('owner_id', targetOwnerId)
    }
    if (user?.role === 'owner') {
        query = query.eq('owner_id', user.id)
    }

    // Search by name, email, or company
    if (searchTerm) {
        query = query.or(
            `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`
        )
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    return { data, totalCount: count }
})

// Get all owners for admin tabs (or privileged owners)
export const getAllOwners = createAsyncThunk('/account/owners', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    const { data: allOwners, error } = await supabase
        .from('owners')
        .select('id, name, email, role')
        .eq('role', 'owner')
        .order('name', { ascending: true })

    if (error) throw error

    // Admin sees everyone
    if (user?.role === 'admin') {
        return allOwners || []
    }

    // Privileged owner: return self + permitted owners
    const allowedEmails = OWNER_PERMISSIONS[user?.email] || []
    if (allowedEmails.length > 0) {
        const visible = (allOwners || []).filter(
            o => o.id === user.id || allowedEmails.includes(o.email)
        )
        return visible
    }

    // Regular owner — only themselves
    return (allOwners || []).filter(o => o.id === user?.id)
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
    const { data: recruiter, error: fetchError } = await supabase
        .from('recruiters')
        .select('owner_id, name')
        .eq('id', id)
        .single()

    if (fetchError) throw fetchError

    // Verify ownership before delete (for owners)
    if (user?.role === 'owner') {
        if (recruiter?.owner_id !== user.id) {
            throw new Error('You can only delete your own recruiters')
        }
    }

    // Preserve owner_id on all contacts for this recruiter
    const { error: ownerError } = await supabase
        .from('contacts')
        .update({ owner_id: recruiter?.owner_id })
        .eq('recruiter_id', id)

    if (ownerError) throw ownerError

    // Move non-failed contacts to "need reconnection"
    const { error: statusError } = await supabase
        .from('contacts')
        .update({ status: 'need reconnection' })
        .eq('recruiter_id', id)
        .neq('status', 'failed')

    if (statusError) throw statusError

    // Soft delete: stamp deleted_at and preserve the name for display
    const { error: softDeleteError } = await supabase
        .from('recruiters')
        .update({
            deleted_at:   new Date().toISOString(),
            deleted_name: recruiter?.name || 'Deleted Recruiter'
        })
        .eq('id', id)

    if (softDeleteError) throw softDeleteError

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