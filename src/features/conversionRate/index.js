import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    BarElement, PointElement, LineElement,
    Title, Tooltip, Legend
} from "chart.js"
import { Bar, Line } from "react-chartjs-2"
import FilterBar from "../dailyReport/components/FilterBar"
import UserFilter from "../dailyReport/components/UserFilter"
import { fetchDailyReports, fetchOwners } from "../dailyReport/services/dailyReportService"

ChartJS.register(
    CategoryScale, LinearScale,
    BarElement, PointElement, LineElement,
    Title, Tooltip, Legend
)

// ─── helpers ─────────────────────────────────────────────────────────────────

const pct = (numerator, denominator) => {
    if (!denominator || denominator === 0) return "-"
    return ((numerator / denominator) * 100).toFixed(1) + "%"
}

const pctNum = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0
    return parseFloat(((numerator / denominator) * 100).toFixed(1))
}

const getInitialBusinessDate = () => {
    const now = new Date()
    const japanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
    if (japanTime.getHours() < 6) japanTime.setDate(japanTime.getDate() - 1)
    return japanTime.toLocaleDateString("en-CA")
}

const getBusinessDate = (offset = 0) => {
    const japanDateText = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date())
    const japanHour = Number(new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tokyo", hour: "2-digit", hour12: false
    }).format(new Date()))
    const date = new Date(`${japanDateText}T00:00:00`)
    if (japanHour < 6) date.setDate(date.getDate() - 1)
    date.setDate(date.getDate() - offset)
    return date.toLocaleDateString("en-CA")
}

const formatDate = (date) => date.toLocaleDateString("en-CA")

// ─── Conversion Rate page ─────────────────────────────────────────────────────

function ConversionRate() {
    const currentUser = useSelector((state) => state.auth.user)
    const isAdmin     = currentUser?.role === "admin"

    const today = getInitialBusinessDate()

    const [dateRange,      setDateRange]      = useState({ startDate: today, endDate: today })
    const [selectedFilter, setSelectedFilter] = useState("Today")
    const [owners,         setOwners]         = useState([])
    const [selectedUserId, setSelectedUserId] = useState("all")
    const [loading,        setLoading]        = useState(false)
    const [rows,           setRows]           = useState([])

    const filterButtons = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month"]

    const getDateRange = () => {
        const businessDate = getBusinessDate()
        const base = new Date(`${businessDate}T00:00:00`)
        let start = new Date(base), end = new Date(base)
        switch (selectedFilter) {
            case "Yesterday":   start.setDate(base.getDate()-1); end.setDate(base.getDate()-1); break
            case "Last 7 Days": start.setDate(base.getDate()-6); break
            case "Last 30 Days":start.setDate(base.getDate()-29); break
            case "This Month":  start = new Date(base.getFullYear(), base.getMonth(), 1); break
            case "Last Month":
                start = new Date(base.getFullYear(), base.getMonth()-1, 1)
                end   = new Date(base.getFullYear(), base.getMonth(), 0)
                break
            case "Custom":
                if (dateRange.startDate && dateRange.endDate) {
                    start = new Date(dateRange.startDate)
                    end   = new Date(dateRange.endDate)
                }
                break
            default: break
        }
        return { startDate: formatDate(start), endDate: formatDate(end) }
    }

    useEffect(() => {
        if (isAdmin) fetchOwners().then(setOwners).catch(console.error)
    }, [isAdmin])

    useEffect(() => { loadData() }, [selectedFilter, dateRange, selectedUserId])

    const loadData = async () => {
        setLoading(true)
        try {
            const { startDate, endDate } = getDateRange()
            const data = await fetchDailyReports({
                isAdmin, userId: currentUser.id, selectedUserId, startDate, endDate
            })
            const byUser = {}
            data.forEach(item => {
                const key = item.user_id
                if (!byUser[key]) byUser[key] = { userId: item.user_id, user: item.user_name, connect: 0, accept: 0, publish: 0, upload: 0 }
                byUser[key].connect += Number(item.connect_count || 0)
                byUser[key].accept  += Number(item.accept_count  || 0)
                byUser[key].publish += Number(item.publish_count || 0)
                byUser[key].upload  += Number(item.upload_count  || 0)
            })
            setRows(Object.values(byUser))
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const totals = useMemo(() => rows.reduce(
        (acc, r) => ({ connect: acc.connect+r.connect, accept: acc.accept+r.accept, publish: acc.publish+r.publish, upload: acc.upload+r.upload }),
        { connect: 0, accept: 0, publish: 0, upload: 0 }
    ), [rows])

    // ── Sort ──────────────────────────────────────────────────────────────────
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('desc')

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('desc') }
    }

    const sortedRows = useMemo(() => {
        if (!sortKey) return rows
        return [...rows].sort((a, b) => {
            let av, bv
            if      (sortKey === 'user')          { av = String(a.user||'').toLowerCase(); bv = String(b.user||'').toLowerCase() }
            else if (sortKey === 'connectAccept') { av = pctNum(a.accept,a.connect);  bv = pctNum(b.accept,b.connect) }
            else if (sortKey === 'acceptPublish') { av = pctNum(a.publish,a.accept);  bv = pctNum(b.publish,b.accept) }
            else if (sortKey === 'publishUpload') { av = pctNum(a.upload,a.publish);  bv = pctNum(b.upload,b.publish) }
            else                                  { av = Number(a[sortKey]??0);        bv = Number(b[sortKey]??0) }
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ?  1 : -1
            return 0
        })
    }, [rows, sortKey, sortDir])

    const SortIcon = ({ k }) => sortKey !== k
        ? <span className="ml-1 opacity-30 text-xs">↕</span>
        : <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>

    const Th = ({ k, children }) => (
        <th className="cursor-pointer select-none hover:bg-base-200 whitespace-nowrap" onClick={() => handleSort(k)}>
            {children}<SortIcon k={k} />
        </th>
    )

    // ── Chart data ────────────────────────────────────────────────────────────
    const userLabels = rows.map(r => r.user)

    const barChartData = {
        labels: userLabels,
        datasets: [
            { label: "Connect", data: rows.map(r => r.connect), backgroundColor: "rgba(59,130,246,0.7)",  borderColor: "rgb(59,130,246)",  borderWidth: 1 },
            { label: "Accept",  data: rows.map(r => r.accept),  backgroundColor: "rgba(16,185,129,0.7)", borderColor: "rgb(16,185,129)", borderWidth: 1 },
            { label: "Publish", data: rows.map(r => r.publish), backgroundColor: "rgba(245,158,11,0.7)", borderColor: "rgb(245,158,11)", borderWidth: 1 },
            { label: "Upload",  data: rows.map(r => r.upload),  backgroundColor: "rgba(139,92,246,0.7)", borderColor: "rgb(139,92,246)", borderWidth: 1 },
        ]
    }

    const barChartOptions = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }

    const lineChartData = {
        labels: userLabels,
        datasets: [
            { label: "Connect → Accept %",  data: rows.map(r => pctNum(r.accept,  r.connect)), borderColor: "rgb(16,185,129)",  backgroundColor: "rgba(16,185,129,0.15)",  tension: 0.4, pointRadius: 5, fill: false },
            { label: "Accept → Publish %",  data: rows.map(r => pctNum(r.publish, r.accept)),  borderColor: "rgb(245,158,11)",  backgroundColor: "rgba(245,158,11,0.15)",  tension: 0.4, pointRadius: 5, fill: false },
            { label: "Publish → Upload %",  data: rows.map(r => pctNum(r.upload,  r.publish)), borderColor: "rgb(139,92,246)",  backgroundColor: "rgba(139,92,246,0.15)", tension: 0.4, pointRadius: 5, fill: false },
        ]
    }

    const lineChartOptions = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } }
        }
    }

    return (
        <div className="p-6">
            <FilterBar
                filterButtons={filterButtons}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
            />

            {isAdmin && owners.length > 0 && (
                <div className="mb-4">
                    <UserFilter owners={owners} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Connect → Accept", num: totals.accept,  den: totals.connect },
                    { label: "Accept → Publish", num: totals.publish, den: totals.accept  },
                    { label: "Publish → Upload", num: totals.upload,  den: totals.publish },
                ].map(({ label, num, den }) => (
                    <div key={label} className="stat bg-base-100 shadow rounded-xl">
                        <div className="stat-title">{label}</div>
                        <div className="stat-value text-primary text-2xl">{pct(num, den)}</div>
                        <div className="stat-desc">{num} / {den}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-md"/>
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">No data for this period</div>
            ) : (
                <>
                    {/* Charts */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        {/* Bar chart — raw counts per user */}
                        <div className="bg-base-100 rounded-xl shadow p-4">
                            <h3 className="font-semibold mb-3">Activity per User</h3>
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>

                        {/* Line chart — conversion rates per user */}
                        <div className="bg-base-100 rounded-xl shadow p-4">
                            <h3 className="font-semibold mb-3">Conversion Rates per User</h3>
                            <Line data={lineChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table table-zebra table-sm w-full">
                            <thead className="sticky top-0 z-10 bg-base-100">
                                <tr>
                                    <th className="whitespace-nowrap">#</th>
                                    <Th k="user">User</Th>
                                    <Th k="connect">Connect</Th>
                                    <Th k="accept">Accept</Th>
                                    <Th k="connectAccept">Connect → Accept</Th>
                                    <Th k="publish">Publish</Th>
                                    <Th k="acceptPublish">Accept → Publish</Th>
                                    <Th k="upload">Upload</Th>
                                    <Th k="publishUpload">Publish → Upload</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRows.map((r, i) => (
                                    <tr key={r.userId}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold">{r.user}</td>
                                        <td>{r.connect}</td>
                                        <td>{r.accept}</td>
                                        <td>
                                            <span className={`badge ${
                                                r.connect === 0              ? 'badge-ghost'   :
                                                r.accept/r.connect >= 0.3   ? 'badge-success' :
                                                r.accept/r.connect >= 0.1   ? 'badge-warning' : 'badge-error'
                                            }`}>{pct(r.accept, r.connect)}</span>
                                        </td>
                                        <td>{r.publish}</td>
                                        <td>
                                            <span className={`badge ${
                                                r.accept === 0              ? 'badge-ghost'   :
                                                r.publish/r.accept >= 0.3   ? 'badge-success' :
                                                r.publish/r.accept >= 0.1   ? 'badge-warning' : 'badge-error'
                                            }`}>{pct(r.publish, r.accept)}</span>
                                        </td>
                                        <td>{r.upload}</td>
                                        <td>
                                            <span className={`badge ${
                                                r.publish === 0              ? 'badge-ghost'   :
                                                r.upload/r.publish >= 0.3   ? 'badge-success' :
                                                r.upload/r.publish >= 0.1   ? 'badge-warning' : 'badge-error'
                                            }`}>{pct(r.upload, r.publish)}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-base-200">
                                    <td colSpan="2">Total</td>
                                    <td>{totals.connect}</td>
                                    <td>{totals.accept}</td>
                                    <td>{pct(totals.accept,  totals.connect)}</td>
                                    <td>{totals.publish}</td>
                                    <td>{pct(totals.publish, totals.accept)}</td>
                                    <td>{totals.upload}</td>
                                    <td>{pct(totals.upload,  totals.publish)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}

export default ConversionRate
