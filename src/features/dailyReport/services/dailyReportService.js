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

export const updateDailyReport = async (id, reportData) => {
    console.log("Updating report:", id, reportData)
    return reportData
}