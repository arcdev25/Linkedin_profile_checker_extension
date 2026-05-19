import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import FilterBar from "./components/FilterBar"
import SummaryCards from "./components/SummaryCards"
import ReportTable from "./components/ReportTable"
import PeriodLabel from "./components/PeriodLabel"
import { fetchDailyReports, saveDailyReport, fetchOwners } from "./services/dailyReportService"
import UserFilter from "./components/UserFilter"


function DailyReport(){
    
    const [selectedDate, setSelectedDate] = useState("")
    const [loading, setLoading] = useState(false)
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")
    const [saveStatus, setSaveStatus] = useState("")
    const [owners, setOwners] = useState([])
    const [selectedUserId, setSelectedUserId] = useState("all")

    const currentUser = useSelector((state) => state.auth.user)
    const isAdmin = currentUser?.role === "admin"

    const [selectedFilter, setSelectedFilter] = useState("Today")
    const filterButtons = [
        "Today",
        "Yesterday",
        "Last 7 Days",
        "Last 30 Days",
        "This Month",
        "Last Month"
    ]
    
    const [reports, setReports] = useState([
        {
            no: 1,
            user: currentUser.name,
            connect: 0,
            accept: 0,
            publish: 0,
            upload: 0,
            balance: 0,
            earning: 0,
            workingTime: 0,
            totalAccount: 0,
            activeAccount: 0,
            lostAccount: 0,
            note: "-"
        }
    ])

    const handleChange = (index, field, value) => {
        const updatedReports = [...reports]
        updatedReports[index][field] = value
        setReports(updatedReports)
    }

    useEffect(() => {

        loadReports()

        if (isAdmin) {
            loadOwners()
        }

    }, [selectedFilter, selectedDate, selectedUserId])
    
    const handleSaveReport = async () => {

        const { startDate }  = getDateRange()
        
        try {

            const report = reports[0]
            const targetUserId =
                isAdmin && selectedUserId !== "all"
                    ? selectedUserId
                    : currentUser.id

            const targetUserName =
                isAdmin && selectedUserId !== "all"
                    ? owners.find((owner) => owner.id === selectedUserId)?.name
                    : currentUser.name

            const reportData = {
                user_id: targetUserId,
                user_name: targetUserName,
                report_date: startDate,

                connect_count: Number(report.connect),
                accept_count: Number(report.accept),
                publish_count: Number(report.publish),
                upload_count: Number(report.upload),

                balance: Number(report.balance),
                earning: Number(report.earning),
                working_time: Number(report.workingTime),

                total_account: Number(report.totalAccount),
                active_account: Number(report.activeAccount),
                lost_account: Number(report.lostAccount),

                note: report.note
            }

            await saveDailyReport(reportData)
            await loadReports()
            setSaveStatus("success")
            setSaveMessage("Report saved successfully!")

        } catch (error) {

            console.error(error)
            setSaveStatus("error")
            setSaveMessage("Failed to save report")

        }
    }

    const getBusinessDate = () => {

        const now = new Date()

        // Convert to Japan timezone
        const japanTime = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Tokyo"
            })
        )

        // Before 6AM → previous day
        if (japanTime.getHours() < 6) {
            japanTime.setDate(japanTime.getDate() - 1)
        }

        return japanTime.toLocaleDateString("en-CA")
    }

    const getDateRange = () => {

        const businessDate = getBusinessDate()

        const today = new Date(`${businessDate}T00:00:00`)

        let startDate = new Date(today)
        let endDate = new Date(today)

        switch (selectedFilter) {

            case "Today":
                break

            case "Yesterday":
                startDate.setDate(today.getDate() - 1)
                endDate.setDate(today.getDate() - 1)
                break

            case "Last 7 Days":
                startDate.setDate(today.getDate() - 6)
                break

            case "Last 30 Days":
                startDate.setDate(today.getDate() - 29)
                break

            case "This Month":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                break

            case "Last Month":
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                endDate = new Date(today.getFullYear(), today.getMonth(), 0)
                break

            case "Custom":
                startDate = new Date(selectedDate)
                endDate = new Date(selectedDate)
                break

            default:
                break
        }

        return {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0]
        }
    }

    const loadOwners = async () => {
        try {
            const data = await fetchOwners()
            setOwners(data)
        } catch (error) {
            console.error(error)
        }
    }
    
    const loadReports = async () => {

        setLoading(true)

        const { startDate, endDate } = getDateRange()

        try {
            
            const data = await fetchDailyReports({
                isAdmin,
                userId: currentUser.id,
                selectedUserId,
                startDate,
                endDate
            })

            const formattedData = data.map((item, index) => ({
                no: index + 1,
                user: item.user_name,
                connect: item.connect_count,
                accept: item.accept_count,
                publish: item.publish_count,
                upload: item.upload_count,
                balance: item.balance,
                earning: item.earning,
                workingTime: item.working_time,
                totalAccount: item.total_account,
                activeAccount: item.active_account,
                lostAccount: item.lost_account,
                note: item.note || "-"
            }))

            if (formattedData.length > 0) {
                setAlreadySubmitted(true)
                setReports(formattedData)
            } else {
                setAlreadySubmitted(false)
                setReports([
                    {
                        no: 1,
                        user: isAdmin
                            ? owners.find((owner) => owner.id === selectedUserId)?.name || ""
                            : currentUser.name,
                        connect: 0,
                        accept: 0,
                        publish: 0,
                        upload: 0,
                        balance: 0,
                        earning: 0,
                        workingTime: 0,
                        totalAccount: 0,
                        activeAccount: 0,
                        lostAccount: 0,
                        note: "-"
                    }
                ])
            }

        } catch (error) {
            console.error(error)
        }
        finally {
            setLoading(false)
        }
    }
    if (!currentUser) {
        return null
    }

    return(
        <div className="p-6">
            
            <FilterBar
                filterButtons={filterButtons}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
            {isAdmin && (
                <div className="mb-4">
                    <UserFilter
                        owners={owners}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                    />
                </div>
            )}

            <PeriodLabel
                selectedFilter={selectedFilter}
                selectedDate={selectedDate}
            />
            
            <SummaryCards reports={reports}/>

            {loading && (
                <div className="flex justify-center mb-4">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            )}

            {!loading && (
                <ReportTable
                    reports={reports}
                    handleChange={handleChange}
                    isAdmin={isAdmin}
                />
            )}

            {saveMessage && (
                <div
                    className={`alert mb-4 ${
                        saveStatus === "success"
                            ? "alert-success"
                            : "alert-error"
                    }`}
                >
                    {saveMessage}
                </div>
            )}

            <div className="flex justify-end mt-6">
                <button
                    className={`btn btn-primary ${loading ? "loading" : ""}`}
                    onClick={handleSaveReport}
                    disabled={loading || (isAdmin && selectedUserId === "all")}
                >
                    {isAdmin
                        ? "Save Changes"
                        : alreadySubmitted
                            ? "Update Report"
                            : "Save Today's Report"}
                </button>
            </div>
        </div>
    )
}

export default DailyReport