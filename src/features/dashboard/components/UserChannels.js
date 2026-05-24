import { useState, useMemo } from "react"
import { useSelector } from "react-redux"
import TitleCard from "../../../components/Cards/TitleCard"

const SORT_OPTIONS = [
    { value: "totalContacts_desc", label: "Most Contacts" },
    { value: "totalContacts_asc",  label: "Least Contacts" },
    { value: "successCount_desc",  label: "Most Success" },
    { value: "conversionRate_desc", label: "Best Conversion" },
    { value: "conversionRate_asc",  label: "Worst Conversion" },
]

function UserChannels() {
    const { stats } = useSelector(state => state.dashboard)
    const [search, setSearch]   = useState("")
    const [sortBy, setSortBy]   = useState("totalContacts_desc")

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()

        let rows = [...(stats.recruiterStats || [])]

        // Search by recruiter name or company
        if (q) {
            rows = rows.filter(r =>
                (r.name    || "").toLowerCase().includes(q) ||
                (r.company || "").toLowerCase().includes(q)
            )
        }

        // Sort
        const [field, dir] = sortBy.split("_")
        rows.sort((a, b) => {
            const av = parseFloat(a[field]) || 0
            const bv = parseFloat(b[field]) || 0
            return dir === "asc" ? av - bv : bv - av
        })

        return rows
    }, [stats.recruiterStats, search, sortBy])

    const FilterControls = (
        <div className="flex items-center gap-2">
            <input
                type="text"
                placeholder="Search recruiter…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input input-bordered input-sm w-36"
            />
            <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="select select-bordered select-sm"
            >
                {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )

    return (
        <TitleCard title="Recruiter Performance" TopSideButtons={FilterControls}>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th></th>
                            <th className="normal-case">Recruiter</th>
                            <th className="normal-case">Total Contacts</th>
                            <th className="normal-case">Success</th>
                            <th className="normal-case">Conversion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    {search ? "No recruiters match your search" : "No recruiter data available"}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((recruiter, k) => (
                                <tr key={recruiter.id}>
                                    <th>{k + 1}</th>
                                    <td>{recruiter.company || 'N/A'}</td>
                                    <td>{recruiter.totalContacts}</td>
                                    <td>{recruiter.successCount}</td>
                                    <td>{`${recruiter.conversionRate}%`}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </TitleCard>
    )
}

export default UserChannels
