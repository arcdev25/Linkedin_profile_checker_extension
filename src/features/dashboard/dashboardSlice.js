import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'
import moment from 'moment'

const DASHBOARD_TIMEZONE_OFFSET = 180
const DASHBOARD_TIMEZONE = '+03:00'

const formatDate = (value) => {
    if (!value) return null

    if (typeof value === 'string') {
        return value.slice(0, 10)
    }

    return moment(value).format('YYYY-MM-DD')
}

const getTimezoneStartIso = (date) => {
    return moment.parseZone(`${date}T00:00:00.000${DASHBOARD_TIMEZONE}`).toISOString()
}

const getTimezoneEndIso = (date) => {
    return moment.parseZone(`${date}T23:59:59.999${DASHBOARD_TIMEZONE}`).toISOString()
}

const getDateRangeDays = (dateRange) => {
    const startDate = formatDate(dateRange?.startDate)
    const endDate = formatDate(dateRange?.endDate)

    if (!startDate || !endDate) return []

    const days = []
    const currentDate = moment(startDate, 'YYYY-MM-DD')
    const finalDate = moment(endDate, 'YYYY-MM-DD')

    while (currentDate.isSameOrBefore(finalDate, 'day') && days.length < 31) {
        days.push(currentDate.format('YYYY-MM-DD'))
        currentDate.add(1, 'day')
    }

    return days
}

export const getDashboardStats = createAsyncThunk('/dashboard/stats', async (params, { getState }) => {
    const { auth } = getState()
    const user = auth.user
    
    // Extract ownerId and dateRange from params
    const ownerId = params?.ownerId
    const dateRange = params?.dateRange

    const startDate = formatDate(dateRange?.startDate)
    const endDate = formatDate(dateRange?.endDate)
    const isAdmin = user?.role === 'admin'

    // Determine which owner's data to fetch. Admins can pass null for all owners.
    let targetOwnerId = isAdmin ? ownerId : user?.id
    
    // If user is owner (not admin), always use their own ID
    if (user?.role === 'owner') {
        targetOwnerId = user.id
    }

    let recruitersQuery = supabase
        .from('recruiters')
        .select('*')
    
    if (targetOwnerId) {
        recruitersQuery = recruitersQuery.eq('owner_id', targetOwnerId)
    }

    const recruitersResult = await recruitersQuery
    if (recruitersResult.error) throw recruitersResult.error

    const recruiters = recruitersResult.data
    const recruiterIds = recruiters.map(recruiter => recruiter.id)

    let contactsQuery = supabase
        .from('contacts')
        .select('*, profiles(*), recruiters(name, company)')
    
    // Filter by owner_id when available, and fall back to recruiter ownership for older rows.
    if (targetOwnerId) {
        const ownerFilter = [`owner_id.eq.${targetOwnerId}`]

        if (recruiterIds.length > 0) {
            ownerFilter.push(`recruiter_id.in.(${recruiterIds.join(',')})`)
        }

        contactsQuery = contactsQuery.or(ownerFilter.join(','))
    }

    // Filter by the selected UTC+3 calendar range.
    if (startDate && endDate) {
        contactsQuery = contactsQuery
            .gte('contacted_at', getTimezoneStartIso(startDate))
            .lte('contacted_at', getTimezoneEndIso(endDate))
    }

    const contactsResult = await contactsQuery
    if (contactsResult.error) throw contactsResult.error

    const contacts = contactsResult.data

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
            company: recruiter.company,
            totalContacts: recruiterContacts.length,
            successCount,
            conversionRate
        }
    })

    // Calculate status trends for the selected date range
    const selectedDays = getDateRangeDays(dateRange)

    const dailyStats = selectedDays.map(date => {
        const dayContacts = contacts.filter(c => moment(c.contacted_at).utcOffset(DASHBOARD_TIMEZONE_OFFSET).format('YYYY-MM-DD') === date)
        return {
            date,
            total: dayContacts.length,
            success: dayContacts.filter(c => c.status === 'success').length,
            pending: dayContacts.filter(c => c.status === 'pending').length,
            chatting: dayContacts.filter(c => c.status === 'chatting').length
        }
    })

    return {
        totalProfiles: contacts.length,
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
