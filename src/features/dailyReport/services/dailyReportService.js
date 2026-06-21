import { supabase } from "../../../lib/supabaseClient"

export const fetchDailyReports = async ({
    isAdmin,
    userId,
    selectedUserId,
    startDate,
    endDate
}) => {

    const today = new Date().toISOString().split("T")[0]

    const safeStartDate = startDate || today
    const safeEndDate = endDate || today

    let query = supabase
        .from("daily_reports")
        .select("*")
        .gte("report_date", safeStartDate)
        .lte("report_date", safeEndDate)
        .order("report_date", { ascending: false })

    if (isAdmin && selectedUserId && selectedUserId !== "all") {
        query = query.eq("user_id", selectedUserId)
    }

    const { data, error } = await query

    if (error) throw error

    return data
}

export const saveDailyReport = async (reportData) => {
    const { data, error } = await supabase
        .from("daily_reports")
        .upsert(reportData, {
            onConflict: "user_id,report_date"
        })
        .select()

    if (error) throw error

    return data
}

export const fetchOwners = async () => {
    const { data, error } = await supabase
        .from("owners")
        .select("id, name, email, role, status")
        .eq("status", "active")
        .neq("role", "admin")
        .order("name", { ascending: true })

    if (error) throw error

    return data
}

export const fetchDashboardConnectCount = async ({
    userId,
    startDate,
    endDate
}) => {
    const { data: recruiters, error: recruitersError } = await supabase
        .from("recruiters")
        .select("id")
        .eq("owner_id", userId)

    if (recruitersError) throw recruitersError

    const recruiterIds = recruiters.map((item) => item.id)

    let query = supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })

    const filters = [`owner_id.eq.${userId}`]

    if (recruiterIds.length > 0) {
        filters.push(`recruiter_id.in.(${recruiterIds.join(",")})`)
    }

    query = query.or(filters.join(","))
   const DASHBOARD_TIMEZONE = "+03:00"

const getTimezoneStartIso = (date) => {
    return new Date(`${date}T00:00:00.000${DASHBOARD_TIMEZONE}`).toISOString()
}

const getTimezoneEndIso = (date) => {
    return new Date(`${date}T23:59:59.999${DASHBOARD_TIMEZONE}`).toISOString()
}
    if (startDate && endDate) {
    query = query
        .gte("contacted_at", getTimezoneStartIso(startDate))
        .lte("contacted_at", getTimezoneEndIso(endDate))
}

    const { count, error } = await query

    if (error) throw error

    console.log("dashboard connect count", count)

    return count || 0
}

export const updateDailyReport = async (id, reportData) => {
    console.log("Updating report:", id, reportData)
    return reportData
}