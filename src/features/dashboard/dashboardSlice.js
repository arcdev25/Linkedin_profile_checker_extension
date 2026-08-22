import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'
import moment from 'moment'
import { getAccessibleOwnerIds } from '../../utils/ownerPermissions'

const DASHBOARD_TIMEZONE_OFFSET = 180
const DASHBOARD_TIMEZONE = '+03:00'

// Owner permission mapping - defines which owners can see other owners' data
const OWNER_PERMISSIONS = {
    'Yura@owner.com': ['Faker@owner.com', '0xGiant@owner.com'],
    'Rape@owner.com': ['0xStrong@owner.com', 'Voldmot@owner.com']
}

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

    // Get all owners for permission checking
    const { data: allOwners, error: ownersError } = await supabase
        .from('owners')
        .select('id, email, name, role')
        .eq('role', 'owner')
    
    if (ownersError) throw ownersError

    // Determine which owner's data to fetch based on permissions
    let targetOwnerIds = []
    
    if (isAdmin) {
        // Admin can access all owners or specific owner if provided
        if (ownerId) {
            targetOwnerIds = [ownerId]
        }
        // If no ownerId provided, targetOwnerIds remains empty (fetch all)
    } else {
        // Non-admin: get accessible owner IDs based on permissions
        const accessibleOwnerIds = getAccessibleOwnerIds(user, allOwners)
        
        if (ownerId && accessibleOwnerIds.includes(ownerId)) {
            // Specific owner requested and user has access
            targetOwnerIds = [ownerId]
        } else if (ownerId && !accessibleOwnerIds.includes(ownerId)) {
            // Requested owner but no access - return empty data
            return {
                totalProfiles: 0,
                totalContacts: 0,
                totalRecruiters: 0,
                lastContactDate: null,
                statusCounts: {},
                statusBreakdown: {},
                recruiterStats: [],
                dailyStats: [],
                recentContacts: []
            }
        } else {
            // No specific owner requested - use all accessible owners
            targetOwnerIds = accessibleOwnerIds
        }
    }

    let recruitersQuery = supabase
        .from('recruiters')
        .select('*')
        .is('deleted_at', null)   // exclude soft-deleted recruiters
    
    // Apply owner filter based on permissions
    if (targetOwnerIds.length > 0) {
        recruitersQuery = recruitersQuery.in('owner_id', targetOwnerIds)
    }

    const recruitersResult = await recruitersQuery
    if (recruitersResult.error) throw recruitersResult.error

    const recruiters = recruitersResult.data
    const recruiterIds = recruiters.map(recruiter => recruiter.id)

    // Helper to apply owner filter to a query
    const applyOwnerFilter = (query) => {
        if (targetOwnerIds.length > 0) {
            const ownerFilter = [`owner_id.in.(${targetOwnerIds.join(',')})`]
            if (recruiterIds.length > 0) {
                ownerFilter.push(`recruiter_id.in.(${recruiterIds.join(',')})`)
            }
            return query.or(ownerFilter.join(','))
        } else if (recruiterIds.length > 0) {
            // If no owner restrictions but have recruiters, filter by recruiters
            return query.in('recruiter_id', recruiterIds)
        }
        return query
    }

    // Fetch ALL rows for a query by paginating through in chunks of 1000
    const fetchAll = async (buildQuery) => {
        const PAGE_SIZE = 1000
        let allRows = []
        let from = 0
        while (true) {
            const q = buildQuery().range(from, from + PAGE_SIZE - 1)
            const { data, error } = await q
            if (error) throw error
            allRows = allRows.concat(data || [])
            if (!data || data.length < PAGE_SIZE) break
            from += PAGE_SIZE
        }
        return allRows
    }

    // Query 1: Total Profiles + Pending — filtered by contacted_at (created date)
    // Only select the minimal fields needed — no heavy profile/recruiter joins
    const createdContacts = await fetchAll(() => {
        let q = supabase
            .from('contacts')
            .select('id, status, contacted_at, updated_at, recruiter_id, owner_id')
        q = applyOwnerFilter(q)
        if (startDate && endDate) {
            q = q
                .gte('contacted_at', getTimezoneStartIso(startDate))
                .lte('contacted_at', getTimezoneEndIso(endDate))
        }
        return q
    })

    // Query 2: Accept, Chatting, Not Interested, Failed, Success — filtered by updated_at
    const updatedContacts = await fetchAll(() => {
        let q = supabase
            .from('contacts')
            .select('id, status, contacted_at, updated_at, recruiter_id, owner_id')
            .not('status', 'eq', 'pending')
        q = applyOwnerFilter(q)
        if (startDate && endDate) {
            q = q
                .gte('updated_at', getTimezoneStartIso(startDate))
                .lte('updated_at', getTimezoneEndIso(endDate))
        }
        return q
    })

    // For each non-pending status, split into:
    //   - "new": contacted_at is within the selected date range (contacted and updated in range)
    //   - "past": contacted_at is before the selected date range (old contact, updated in range)
    const statusBreakdown = {}
    const rangeStart = startDate ? getTimezoneStartIso(startDate) : null
    const rangeEnd   = endDate   ? getTimezoneEndIso(endDate)     : null

    updatedContacts.forEach(c => {
        const status = c.status
        if (!statusBreakdown[status]) {
            statusBreakdown[status] = { new: 0, past: 0 }
        }
        const contactedAt = c.contacted_at
        const isNew = rangeStart && rangeEnd
            ? contactedAt >= rangeStart && contactedAt <= rangeEnd
            : true
        if (isNew) {
            statusBreakdown[status].new += 1
        } else {
            statusBreakdown[status].past += 1
        }
    })

    // Status counts: pending from createdContacts, rest from updatedContacts
    const statusCounts = {
        pending: createdContacts.filter(c => c.status === 'pending').length,
        ...updatedContacts.reduce((acc, contact) => {
            acc[contact.status] = (acc[contact.status] || 0) + 1
            return acc
        }, {})
    }

    // Calculate recruiter performance — count contacts per recruiter_id
    const recruiterStats = recruiters.map(recruiter => {
        const recruiterContacts = createdContacts.filter(c => c.recruiter_id === recruiter.id)
        const successCount = updatedContacts.filter(c => c.recruiter_id === recruiter.id && c.status === 'success').length
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
        // Total and pending grouped by contacted_at (created date)
        const dayCreated = createdContacts.filter(c => moment(c.contacted_at).utcOffset(DASHBOARD_TIMEZONE_OFFSET).format('YYYY-MM-DD') === date)
        // Success and chatting grouped by updated_at
        const dayUpdated = updatedContacts.filter(c => moment(c.updated_at).utcOffset(DASHBOARD_TIMEZONE_OFFSET).format('YYYY-MM-DD') === date)
        return {
            date,
            total: dayCreated.length,
            accept: dayUpdated.filter(c => c.status === 'accept').length,
            success: dayUpdated.filter(c => c.status === 'success').length,
            pending: dayCreated.filter(c => c.status === 'pending').length,
            chatting: dayUpdated.filter(c => c.status === 'chatting').length
        }
    })

    // Last contact date = the most recent contacted_at among all createdContacts
    const lastContactDate = createdContacts.length > 0
        ? createdContacts.reduce((latest, c) =>
            c.contacted_at > latest ? c.contacted_at : latest,
            createdContacts[0].contacted_at)
        : null

    return {
        totalProfiles: createdContacts.length,
        totalContacts: createdContacts.length,
        totalRecruiters: recruiters.length,
        lastContactDate,
        statusCounts,
        statusBreakdown,
        recruiterStats,
        dailyStats,
        recentContacts: []
    }
})

// Get all owners for admin tabs (or owners with permissions)
export const getAllOwners = createAsyncThunk('/dashboard/owners', async (_, { getState }) => {
    const { auth } = getState()
    const user = auth.user

    if (user?.role === 'admin') {
        // Admin sees all owners
        const { data, error } = await supabase
            .from('owners')
            .select('id, name, email, role')
            .eq('role', 'owner')
            .order('name', { ascending: true })
        
        if (error) throw error
        return data
    } else if (user?.role === 'owner') {
        // Check if owner has permission to see other owners
        const allowedEmails = OWNER_PERMISSIONS[user.email] || []
        
        if (allowedEmails.length > 0) {
            // Get self + allowed owners
            const { data, error } = await supabase
                .from('owners')
                .select('id, name, email, role')
                .or(`id.eq.${user.id},email.in.(${allowedEmails.map(e => `"${e}"`).join(',')})`)
                .order('name', { ascending: true })
            
            if (error) throw error
            return data
        } else {
            // Regular owner - only return self
            return [{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }]
        }
    }
    
    return []
})

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        isLoading: false,
        stats: {
            totalProfiles: 0,
            totalContacts: 0,
            totalRecruiters: 0,
            lastContactDate: null,
            statusCounts: {},
            statusBreakdown: {},
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
