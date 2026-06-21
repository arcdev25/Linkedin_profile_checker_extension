import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    PointElement, LineElement,
    Title, Tooltip, Legend
} from "chart.js"
import { Line } from "react-chartjs-2"
import FilterBar from "../dailyReport/components/FilterBar"
import UserFilter from "../dailyReport/components/UserFilter"
import { fetchDailyReports, fetchOwners } from "../dailyReport/services/dailyReportService"

ChartJS.register(
    CategoryScale, LinearScale,
    PointElement, LineElement,
    Title, Tooltip, Legend
)

// ─── helpers ─────────────────────────────────────────────────────────────────

const pct = (n, d) => (!d ? "-" : ((n / d) * 100).toFixed(1) + "%")
const pctNum = (n, d) => (!d ? 0 : parseFloat(((n / d) * 100).toFixed(1)))

const getInitialBusinessDate = () => {
    const now = new Date()
    const jp = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
    if (jp.getHours() < 6) jp.setDate(jp.getDate() - 1)
    return jp.toLocaleDateString("en-CA")
}

const getBusinessDate = (offset = 0) => {
    const text = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date())
    const hour = Number(new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tokyo", hour: "2-digit", hour12: false
    }).format(new Date()))
    const d = new Date(`${text}T00:00:00`)
    if (hour < 6) d.setDate(d.getDate() - 1)
    d.setDate(d.getDate() - offset)
    return d.toLocaleDateString("en-CA")
}

const fmt = (d) => d.toLocaleDateString("en-CA")

// Short date label for X axis e.g. "Jun 08"
const shortDate = (iso) => {
    const [, m, day] = iso.split("-")
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `${months[Number(m)-1]} ${day}`
}

// ─── ConversionRate page ─────────────────────────────────────────────────────

function ConversionRate() {
    const currentUser = useSelector((state) => state.auth.user)
    const isAdmin     = currentUser?.role === "admin"
    const today       = getInitialBusinessDate()

    const [dateRange,      setDateRange]      = useState({ startDate: today, endDate: today })
    const [selectedFilter, setSelectedFilter] = useState("Today")
    const [owners,         setOwners]         = useState([])
    const [selectedUserId, setSelectedUserId] = useState("all")
    const [loading,        setLoading]        = useState(false)

    // rawByUser: { [userId]: { user, dates: { [date]: {connect,accept,publish,upload} } } }
    const [rawByUser, setRawByUser] = useState({})

    const filterButtons = ["Today","Yesterday","Last 7 Days","Last 30 Days","This Month","Last Month"]

    const getDateRange = () => {
        const base = new Date(`${getBusinessDate()}T00:00:00`)
        let start = new Date(base), end = new Date(base)
        switch (selectedFilter) {
            case "Yesterday":    start.setDate(base.getDate()-1); end.setDate(base.getDate()-1); break
            case "Last 7 Days":  start.setDate(base.getDate()-6); break
            case "Last 30 Days": start.setDate(base.getDate()-29); break
            case "This Month":   start = new Date(base.getFullYear(), base.getMonth(), 1); break
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
        return { startDate: fmt(start), endDate: fmt(end) }
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

            // Build: { userId -> { user, dates: { date -> {connect,accept,publish,upload} } } }
            const byUser = {}
            data.forEach(item => {
                const uid  = item.user_id
                const date = item.report_date
                if (!byUser[uid]) byUser[uid] = { userId: uid, user: item.user_name, dates: {} }
                byUser[uid].dates[date] = {
                    connect: Number(item.connect_count || 0),
                    accept:  Number(item.accept_count  || 0),
                    publish: Number(item.publish_count || 0),
                    upload:  Number(item.upload_count  || 0),
                }
            })
            setRawByUser(byUser)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    // Flatten to sorted user list with totals for the table
    const userList = useMemo(() =>
        Object.values(rawByUser).map(u => {
            const totals = Object.values(u.dates).reduce(
                (acc, d) => ({
                    connect: acc.connect + d.connect,
                    accept:  acc.accept  + d.accept,
                    publish: acc.publish + d.publish,
                    upload:  acc.upload  + d.upload,
                }),
                { connect: 0, accept: 0, publish: 0, upload: 0 }
            )
            return { ...u, ...totals }
        })
    , [rawByUser])

    const totals = useMemo(() => userList.reduce(
        (acc, r) => ({
            connect: acc.connect + r.connect,
            accept:  acc.accept  + r.accept,
            publish: acc.publish + r.publish,
            upload:  acc.upload  + r.upload,
        }),
        { connect: 0, accept: 0, publish: 0, upload: 0 }
    ), [userList])

    // ── Sort (table) ──────────────────────────────────────────────────────────
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('desc')
    const handleSort = (k) => {
        if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(k); setSortDir('desc') }
    }
    const sortedRows = useMemo(() => {
        if (!sortKey) return userList
        return [...userList].sort((a, b) => {
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
    }, [userList, sortKey, sortDir])

    const SortIcon = ({ k }) => sortKey !== k
        ? <span className="ml-1 opacity-30 text-xs">↕</span>
        : <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
    const Th = ({ k, children }) => (
        <th className="cursor-pointer select-none hover:bg-base-200 whitespace-nowrap" onClick={() => handleSort(k)}>
            {children}<SortIcon k={k}/>
        </th>
    )

    // ── Per-user chart builder (X = sorted dates) ─────────────────────────────
    const makeUserChartData = (u) => {
        const dates = Object.keys(u.dates).sort()
        const labels = dates.map(shortDate)
        return {
            labels,
            datasets: [
                {
                    label: "Connect",
                    data: dates.map(d => u.dates[d].connect),
                    borderColor: "rgb(59,130,246)",
                    backgroundColor: "rgba(59,130,246,0.1)",
                    tension: 0.4,
                    pointRadius: 4,
                    fill: false,
                },
                {
                    label: "Accept",
                    data: dates.map(d => u.dates[d].accept),
                    borderColor: "rgb(16,185,129)",
                    backgroundColor: "rgba(16,185,129,0.1)",
                    tension: 0.4,
                    pointRadius: 4,
                    fill: false,
                },
                {
                    label: "Publish",
                    data: dates.map(d => u.dates[d].publish),
                    borderColor: "rgb(245,158,11)",
                    backgroundColor: "rgba(245,158,11,0.1)",
                    tension: 0.4,
                    pointRadius: 4,
                    fill: false,
                },
                {
                    label: "Upload",
                    data: dates.map(d => u.dates[d].upload),
                    borderColor: "rgb(139,92,246)",
                    backgroundColor: "rgba(139,92,246,0.1)",
                    tension: 0.4,
                    pointRadius: 4,
                    fill: false,
                },
            ]
        }
    }

    const chartOptions = {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        tension: 0.4,
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
                    <UserFilter owners={owners} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId}/>
                </div>
            )}

            {/* Overall summary cards */}
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
            ) : userList.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">No data for this period</div>
            ) : (
                <>
                    {/* Per-user chart cards — X axis = date */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        {Object.values(rawByUser).map((u) => {
                            const totalU = userList.find(r => r.userId === u.userId) || {}
                            return (
                                <div key={u.userId} className="bg-base-100 rounded-xl shadow p-4">
                                    {/* Header */}
                                    <h3 className="font-bold text-lg mb-1">{u.user}</h3>

                                    {/* Conversion rate badges */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {[
                                            { label: "Connect→Accept", num: totalU.accept,  den: totalU.connect },
                                            { label: "Accept→Publish", num: totalU.publish, den: totalU.accept  },
                                            { label: "Publish→Upload", num: totalU.upload,  den: totalU.publish },
                                        ].map(({ label, num, den }) => {
                                            const rate = den > 0 ? num / den : 0
                                            const cls  = den === 0    ? 'badge-ghost'
                                                : rate >= 0.3         ? 'badge-success'
                                                : rate >= 0.1         ? 'badge-warning'
                                                :                        'badge-error'
                                            return (
                                                <span key={label} className={`badge badge-md ${cls}`}>
                                                    {label}: {pct(num, den)}
                                                </span>
                                            )
                                        })}
                                    </div>

                                    {/* Line chart with date X-axis */}
                                    <Line data={makeUserChartData(u)} options={chartOptions}/>
                                </div>
                            )
                        })}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table table-zebra table-sm w-full">
                            <thead className="sticky top-0 z-10 bg-base-100">
                                <tr>
                                    <th>#</th>
                                    <Th k="user">User</Th>
                                    <Th k="connect">Connect</Th>
                                    <Th k="accept">Accept</Th>
                                    <Th k="connectAccept">Connect→Accept</Th>
                                    <Th k="publish">Publish</Th>
                                    <Th k="acceptPublish">Accept→Publish</Th>
                                    <Th k="upload">Upload</Th>
                                    <Th k="publishUpload">Publish→Upload</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRows.map((r, i) => (
                                    <tr key={r.userId}>
                                        <td>{i+1}</td>
                                        <td className="font-semibold">{r.user}</td>
                                        <td>{r.connect}</td>
                                        <td>{r.accept}</td>
                                        <td><span className={`badge ${
                                            r.connect===0             ? 'badge-ghost'   :
                                            r.accept/r.connect>=0.3  ? 'badge-success' :
                                            r.accept/r.connect>=0.1  ? 'badge-warning' : 'badge-error'
                                        }`}>{pct(r.accept,r.connect)}</span></td>
                                        <td>{r.publish}</td>
                                        <td><span className={`badge ${
                                            r.accept===0             ? 'badge-ghost'   :
                                            r.publish/r.accept>=0.3  ? 'badge-success' :
                                            r.publish/r.accept>=0.1  ? 'badge-warning' : 'badge-error'
                                        }`}>{pct(r.publish,r.accept)}</span></td>
                                        <td>{r.upload}</td>
                                        <td><span className={`badge ${
                                            r.publish===0             ? 'badge-ghost'   :
                                            r.upload/r.publish>=0.3  ? 'badge-success' :
                                            r.upload/r.publish>=0.1  ? 'badge-warning' : 'badge-error'
                                        }`}>{pct(r.upload,r.publish)}</span></td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-base-200">
                                    <td colSpan="2">Total</td>
                                    <td>{totals.connect}</td>
                                    <td>{totals.accept}</td>
                                    <td>{pct(totals.accept,totals.connect)}</td>
                                    <td>{totals.publish}</td>
                                    <td>{pct(totals.publish,totals.accept)}</td>
                                    <td>{totals.upload}</td>
                                    <td>{pct(totals.upload,totals.publish)}</td>
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
