const SORTABLE_COLS = [
    { key: 'user',          label: 'User',               userOnly: true  },
    { key: 'connect',       label: 'Connect * 2',        userOnly: false },
    { key: 'accept',        label: 'Accept * 4',         userOnly: false },
    { key: 'publish',       label: 'Publish * 5',        userOnly: false },
    { key: 'upload',        label: 'Upload * 10',        userOnly: false },
    { key: 'balance',       label: 'Balance * 20',       userOnly: false },
    { key: 'earning',       label: 'Earning * 50',       userOnly: false },
    { key: 'workingTime',   label: 'Working Time * 5',   userOnly: false },
    { key: 'totalAccount',  label: 'Total Account * 2',  userOnly: false },
    { key: 'activeAccount', label: 'Active Account * 2', userOnly: false },
    { key: 'lostAccount',   label: 'Lost Account * -10', userOnly: false },
]

function SortIcon({ active, dir }) {
    if (!active) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

function ReportTable({
    reports,
    handleChange,
    isAdmin,
    currentUser,
    readonly = false,
    showUserColumns = false,
    sortKey = null,
    sortDir = 'desc',
    onSort = null
}) {

    const handleNumericChange = (userId, field, value) => {
        const numericRegex = /^\d*\.?\d*$/
        if (numericRegex.test(value)) {
            handleChange(userId, field, value)
        }
    }

    const renderTh = (col) => {
        // Only show User column when showUserColumns is true
        if (col.userOnly && !showUserColumns) return null

        const sortable = showUserColumns && onSort  // only admin table is sortable
        const active   = sortKey === col.key

        return (
            <th
                key={col.key}
                onClick={sortable ? () => onSort(col.key) : undefined}
                className={sortable ? "cursor-pointer select-none hover:bg-base-200 whitespace-nowrap" : "whitespace-nowrap"}
            >
                {col.label}
                {sortable && <SortIcon active={active} dir={sortDir} />}
            </th>
        )
    }

    return (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
            <table className="table table-zebra table-sm w-full">
                <thead className="sticky top-0 z-10 bg-base-100">
                    <tr>
                        {showUserColumns && (
                            <th className="whitespace-nowrap">No</th>
                        )}
                        {SORTABLE_COLS.map(col => {
                            if (col.key === 'user' && !showUserColumns) return null
                            const sortable = showUserColumns && onSort
                            const active   = sortKey === col.key
                            return (
                                <th
                                    key={col.key}
                                    onClick={sortable ? () => onSort(col.key) : undefined}
                                    className={sortable
                                        ? "cursor-pointer select-none hover:bg-base-200 whitespace-nowrap"
                                        : "whitespace-nowrap"}
                                >
                                    {col.label}
                                    {sortable && <SortIcon active={active} dir={sortDir} />}
                                </th>
                            )
                        })}
                        <th className="whitespace-nowrap">Note</th>
                    </tr>
                </thead>

                <tbody>
                    {reports.map((report, index) => {
                        const canEdit = !readonly && (isAdmin || report.userId === currentUser.id)
                        return (
                            <tr key={index}>
                                {showUserColumns && <td>{report.no}</td>}

                                {showUserColumns && (
                                    <td>
                                        <input
                                            className="input input-sm input-bordered w-32"
                                            value={report.user}
                                            disabled
                                        />
                                    </td>
                                )}

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.connect}
                                        onChange={(e) => handleNumericChange(report.userId, "connect", e.target.value)}
                                        disabled
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.accept}
                                        onChange={(e) => handleNumericChange(report.userId, "accept", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.publish}
                                        onChange={(e) => handleNumericChange(report.userId, "publish", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.upload}
                                        onChange={(e) => handleNumericChange(report.userId, "upload", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.balance}
                                        onChange={(e) => handleNumericChange(report.userId, "balance", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-16"
                                        value={report.earning}
                                        onChange={(e) => handleNumericChange(report.userId, "earning", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-20"
                                        value={report.workingTime}
                                        onChange={(e) => handleNumericChange(report.userId, "workingTime", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-20"
                                        value={report.totalAccount}
                                        onChange={(e) => handleNumericChange(report.userId, "totalAccount", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-20"
                                        value={report.activeAccount}
                                        onChange={(e) => handleNumericChange(report.userId, "activeAccount", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-sm input-bordered w-20"
                                        value={report.lostAccount}
                                        onChange={(e) => handleNumericChange(report.userId, "lostAccount", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>

                                <td>
                                    <input
                                        className="input input-sm input-bordered w-28"
                                        value={report.note}
                                        onChange={(e) => handleChange(report.userId, "note", e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default ReportTable
