function ReportTable({
    reports,
    handleChange,
    isAdmin,
    currentUser,
    readonly = false,
    showUserColumns = false
}) {

    const handleNumericChange = (userId, field, value) => {
        const numericRegex = /^\d*\.?\d*$/

        if (numericRegex.test(value)) {
            handleChange(userId, field, value)
        }
    }

    return (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">

            <table className="table table-zebra table-sm w-full">

                <thead className="sticky top-0 z-10 bg-base-100">
                    <tr>
                        {showUserColumns && <th>No</th>}
                        {showUserColumns && <th>User</th>}
                        <th>Connect * 2</th>
                        <th>Accept * 5</th>
                        <th>Publish * 8</th>
                        <th>Upload * 15</th>
                        <th>Balance * 20</th>
                        <th>Earning * 30</th>
                        <th>Working Time * 5</th>
                        <th>Total Account * 5</th>
                        <th>Active Account * 10</th>
                        <th>Lost Account * -10</th>
                        <th>Note</th>
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
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "connect", e.target.value)
                                    }
                                    disabled
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-16"
                                    value={report.accept}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "accept", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-16"
                                    value={report.publish}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "publish", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-16"
                                    value={report.upload}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "upload", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-16"
                                    value={report.balance}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "balance", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-16"
                                    value={report.earning}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "earning", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-20"
                                    value={report.workingTime}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "workingTime", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-20"
                                    value={report.totalAccount}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "totalAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-20"
                                    value={report.activeAccount}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "activeAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered w-20"
                                    value={report.lostAccount}
                                    onChange={(e) =>
                                        handleNumericChange(report.userId, "lostAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-28"
                                    value={report.note}
                                    onChange={(e) =>
                                        handleChange(report.userId, "note", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                        </tr>
                    )})}

                </tbody>

            </table>

        </div>
    )
}

export default ReportTable