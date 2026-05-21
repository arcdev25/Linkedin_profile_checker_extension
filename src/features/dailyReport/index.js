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
    const [rawReports, setRawReports] = useState([])

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
            userId: currentUser.id,
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

    const handleChange = (userId, field, value) => {
        const updatedReports = reports.map((report) => {
            if (String(report.userId) === String(userId)) {
                return {
                    ...report,
                    [field]: value
                }
            }

            return report
        })

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

            const report = isAdmin
                ? reports.find((item) => String(item.userId) === String(selectedUserId))
                : reports.find((item) => String(item.userId) === String(currentUser.id))
                
            if (!report) {
                setSaveStatus("error")
                setSaveMessage("No report row found to save")
                return
            }
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

    const getBusinessDate = (offset = 0) => {
        const japanDateText = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date())

        const japanHour = Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Tokyo",
                hour: "2-digit",
                hour12: false
            }).format(new Date())
        )

        const date = new Date(`${japanDateText}T00:00:00`)

        if (japanHour < 6) {
            date.setDate(date.getDate() - 1)
        }

        date.setDate(date.getDate() - offset)
        return date.toLocaleDateString("en-CA")
    }

    const formatDate = (date) => {
        return date.toLocaleDateString("en-CA")
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
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
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

    const groupReportsByUser = (data) => {
        const grouped = {}

        data.forEach((report) => {
            const key = report.userId

            if (!grouped[key]) {
                grouped[key] = {
                    ...report,
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
            }

            grouped[key].connect += Number(report.connect || 0)
            grouped[key].accept += Number(report.accept || 0)
            grouped[key].publish += Number(report.publish || 0)
            grouped[key].upload += Number(report.upload || 0)
            grouped[key].balance += Number(report.balance || 0)
            grouped[key].earning += Number(report.earning || 0)
            grouped[key].workingTime += Number(report.workingTime || 0)
            grouped[key].totalAccount += Number(report.totalAccount || 0)
            grouped[key].activeAccount += Number(report.activeAccount || 0)
            grouped[key].lostAccount += Number(report.lostAccount || 0)
        })

        return Object.values(grouped).map((report, index) => ({
            ...report,
            no: index + 1,
            workingTime: Number(report.workingTime.toFixed(2))
        }))
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
            setRawReports(data)

            const formattedData = data.map((item, index) => ({
                no: index + 1,
                userId: item.user_id,
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

            const shouldGroupByUser = !["Today", "Yesterday", "Custom"].includes(selectedFilter)

            const displayData = shouldGroupByUser
                ? groupReportsByUser(formattedData)
                : formattedData

            const currentUserReport = displayData.find(
                (report) =>
                    String(report.userId).trim() === String(currentUser.id).trim()
            )

            let finalReports = [...displayData]

            if (!isAdmin && !currentUserReport) {
                finalReports.unshift({
                    no: 1,
                    userId: currentUser.id,
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
                })
            }

            if (isAdmin && displayData.length === 0 && selectedUserId !== "all") {
                finalReports = [
                    {
                        no: 1,
                        userId: selectedUserId,
                        user: owners.find((owner) => owner.id === selectedUserId)?.name || "",
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
                ]
            }

            setAlreadySubmitted(!!currentUserReport)
            setReports(finalReports)

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

    const myReports = reports.filter(
        (report) =>
            String(report.userId).trim() ===
            String(currentUser.id).trim()
    )

    const otherReports = reports.filter(
        (report) =>
            String(report.userId).trim() !==
            String(currentUser.id).trim()
    )

    const summaryReports = isAdmin ? reports : myReports

    const summaryRawReports = isAdmin
        ? rawReports
        : rawReports.filter(
            (report) =>
                String(report.user_id).trim() ===
                String(currentUser.id).trim()
        )

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
            
            <SummaryCards reports={summaryReports} rawReports={summaryRawReports} />

            {loading && (
                <div className="flex justify-center mb-4">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            )}

            {!loading && !isAdmin && (
                <>
                    <h2 className="text-lg font-semibold mb-3">My Report</h2>

                    <ReportTable
                        reports={myReports}
                        handleChange={handleChange}
                        isAdmin={isAdmin}
                        currentUser={currentUser}
                        showUserColumns={false}
                    />

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

                    <div className="flex justify-end mt-6 mb-10">
                        <button
                            className={`btn btn-primary ${loading ? "loading" : ""}`}
                            onClick={handleSaveReport}
                            disabled={loading}
                        >
                            {alreadySubmitted ? "Update Report" : "Save Today's Report"}
                        </button>
                    </div>

                    <h2 className="text-lg font-semibold mb-3">Other Users' Reports</h2>

                    <ReportTable
                        reports={otherReports}
                        handleChange={handleChange}
                        isAdmin={false}
                        currentUser={currentUser}
                        readonly={true}
                        showUserColumns={true}
                    />
                </>
            )}

            {!loading && isAdmin && (
                <>
                    <ReportTable
                        reports={reports}
                        handleChange={handleChange}
                        isAdmin={isAdmin}
                        currentUser={currentUser}
                        showUserColumns={true}
                    />

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
                            disabled={loading || selectedUserId === "all"}
                        >
                            Save Changes
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default DailyReport