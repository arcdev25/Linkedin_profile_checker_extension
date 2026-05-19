function ReportTable({ reports, handleChange, isAdmin }) {

    return (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">

            <table className="table table-zebra table-sm w-full">

                <thead className="sticky top-0 z-10 bg-base-100">
                    <tr>
                        {isAdmin && <th>No</th>}
                        {isAdmin && <th>User</th>}
                        <th>Connect</th>
                        <th>Accept</th>
                        <th>Publish</th>
                        <th>Upload</th>
                        <th>Balance</th>
                        <th>Earning</th>
                        <th>Working Time</th>
                        <th>Total Account</th>
                        <th>Active Account</th>
                        <th>Lost Account</th>
                        <th>Note</th>
                    </tr>
                </thead>

                <tbody>

                    {reports.map((report, index) => (
                        <tr key={index}>

                            {isAdmin && <td>{report.no}</td>}

                            {isAdmin && (
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
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.publish}
                                    onChange={(e) =>
                                        handleChange(index, "publish", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.upload}
                                    onChange={(e) =>
                                        handleChange(index, "upload", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.balance}
                                    onChange={(e) =>
                                        handleChange(index, "balance", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-16"
                                    value={report.earning}
                                    onChange={(e) =>
                                        handleChange(index, "earning", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.workingTime}
                                    onChange={(e) =>
                                        handleChange(index, "workingTime", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.totalAccount}
                                    onChange={(e) =>
                                        handleChange(index, "totalAccount", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.activeAccount}
                                    onChange={(e) =>
                                        handleChange(index, "activeAccount", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-20"
                                    value={report.lostAccount}
                                    onChange={(e) =>
                                        handleChange(index, "lostAccount", e.target.value)
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    className="input input-sm input-bordered w-28"
                                    value={report.note}
                                    onChange={(e) =>
                                        handleChange(index, "note", e.target.value)
                                    }
                                />
                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    )
}

export default ReportTable