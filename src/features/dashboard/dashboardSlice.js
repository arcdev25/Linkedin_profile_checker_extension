import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'

export const getDashboardStats = createAsyncThunk('/dashboard/stats', async (ownerId, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    // Determine which owner's data to fetch
    let targetOwnerId = ownerId || user?.id
    
    // If user is owner (not admin), always use their own ID
    if (user?.role === 'owner') {
        targetOwnerId = user.id
    }

    // Fetch data based on owner
    const [profilesResult, contactsResult, recruitersResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('contacts').select('*, recruiters(owner_id)'),
        targetOwnerId 
            ? supabase.from('recruiters').select('*').eq('owner_id', targetOwnerId)
            : supabase.from('recruiters').select('*')
    ])

    if (profilesResult.error) throw profilesResult.error
    if (contactsResult.error) throw contactsResult.error
    if (recruitersResult.error) throw recruitersResult.error

    const profiles = profilesResult.data
    const allContacts = contactsResult.data
    const recruiters = recruitersResult.data

    // Filter contacts by owner's recruiters
    const recruiterIds = recruiters.map(r => r.id)
    const contacts = allContacts.filter(c => recruiterIds.includes(c.recruiter_id))

    // Calculate stats by status
    const statusCounts = contacts.reduce((acc, contact) => {
        acc[contact.status] = (acc[contact.status] || 0) + 1
        return acc
    }, {})

    // Calculate recruiter performance
    const recruiterStats = recruiters.map(recruiter => {
        const recruiterContacts = contacts.filter(c => c.recruiter_id === recruiter.id)
        const successCount = recruiterContacts.filter(c => c.status === 'success').length
        const conversionRate = recruiterContacts.length > 0 
            ? ((successCount / recruiterContacts.length) * 100).toFixed(1)
            : 0

        return {
            id: recruiter.id,
            name: recruiter.name,
            totalContacts: recruiterContacts.length,
            successCount,
            conversionRate
        }
    })

    // Calculate status trends (last 7 days)
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
    })

    const dailyStats = last7Days.map(date => {
        const dayContacts = contacts.filter(c => 
            c.contacted_at && c.contacted_at.startsWith(date)
        )
        return {
            date,
            total: dayContacts.length,
            success: dayContacts.filter(c => c.status === 'success').length,
            pending: dayContacts.filter(c => c.status === 'pending').length,
            chatting: dayContacts.filter(c => c.status === 'chatting').length
        }
    })

    return {
        totalProfiles: contacts.length, // Only contacted profiles count
        totalContacts: contacts.length,
        totalRecruiters: recruiters.length,
        statusCounts,
        recruiterStats,
        dailyStats,
        recentContacts: contacts
            .sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))
            .slice(0, 10)
    }
})

// Get all owners for admin tabs
export const getAllOwners = createAsyncThunk('/dashboard/owners', async () => {
    const { data, error } = await supabase
        .from('owners')
        .select('id, name, email, role')
        .eq('role', 'owner')
        .order('name', { ascending: true })
    
    if (error) throw error
    return data
})

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        isLoading: false,
        stats: {
            totalProfiles: 0,
            totalContacts: 0,
            totalRecruiters: 0,
            statusCounts: {},
            recruiterStats: [],
            dailyStats: [],
            recentContacts: []
        },
        owners: [],
        selectedOwnerId: null
    },
    reducers: {
        setSelectedOwner: (state, action) => {
            state.selectedOwnerId = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDashboardStats.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getDashboardStats.fulfilled, (state, action) => {
                state.stats = action.payload
                state.isLoading = false
            })
            .addCase(getDashboardStats.rejected, (state) => {
                state.isLoading = false
            })
            .addCase(getAllOwners.fulfilled, (state, action) => {
                state.owners = action.payload
            })
    }
})

export const { setSelectedOwner } = dashboardSlice.actions

export default dashboardSlice.reducer
