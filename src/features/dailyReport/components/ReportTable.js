function ReportTable({
    reports,
    handleChange,
    isAdmin,
    currentUser,
    readonly = false,
    showUserColumns = false
}) {

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
                                    className="input input-sm input-bordered w-16"
                                    value={report.connect}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        handleChange(index, "connect", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.accept}
                                    onChange={(e) =>
                                        handleChange(index, "accept", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.publish}
                                    onChange={(e) =>
                                        handleChange(index, "publish", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.upload}
                                    onChange={(e) =>
                                        handleChange(index, "upload", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.balance}
                                    onChange={(e) =>
                                        handleChange(index, "balance", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.earning}
                                    onChange={(e) =>
                                        handleChange(index, "earning", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.workingTime}
                                    onChange={(e) =>
                                        handleChange(index, "workingTime", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.totalAccount}
                                    onChange={(e) =>
                                        handleChange(index, "totalAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.activeAccount}
                                    onChange={(e) =>
                                        handleChange(index, "activeAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.lostAccount}
                                    onChange={(e) =>
                                        handleChange(index, "lostAccount", e.target.value)
                                    }
                                    disabled={!canEdit}
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-28"
                                    value={report.note}
                                    onChange={(e) =>
                                        handleChange(index, "note", e.target.value)
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