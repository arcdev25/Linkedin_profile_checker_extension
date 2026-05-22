function SummaryCards({ reports, rawReports }) {

    const totalConnect = reports.reduce((sum, item) => sum + Number(item.connect || 0), 0)
    const totalAccept = reports.reduce((sum, item) => sum + Number(item.accept || 0), 0)
    const totalPublish = reports.reduce((sum, item) => sum + Number(item.publish || 0), 0)
    const totalUpload = reports.reduce((sum, item) => sum + Number(item.upload || 0), 0)
    
    const totalWorkingHours = reports.reduce(
        (sum, item) => sum + Number(item.workingTime || 0),
        0
    )

    const validWorkingReports = rawReports.filter(
        (report) =>
            report.working_time !== null &&
            report.working_time !== undefined &&
            report.working_time !== ""
    )

    const totalWorkingTime = validWorkingReports.reduce(
        (sum, report) =>
            sum + Number(report.working_time || 0),
        0
    )

    const avgWorkingHours =
        validWorkingReports.length > 0
            ? totalWorkingTime / validWorkingReports.length
            : 0
    const acceptanceRate = totalConnect > 0
        ? ((totalAccept / totalConnect) * 100).toFixed(1)
        : 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Total Connect</div>
                    <div className="stat-value text-primary">{totalConnect}</div>
                </div>
            </div>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Total Accept</div>
                    <div className="stat-value text-success">{totalAccept}</div>
                </div>
            </div>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Acceptance Rate</div>
                    <div className="stat-value">{acceptanceRate}%</div>
                </div>
            </div>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Total Publish</div>
                    <div className="stat-value">{totalPublish}</div>
                </div>
            </div>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Total Upload</div>
                    <div className="stat-value">{totalUpload}</div>
                </div>
            </div>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Avg Working Hours</div>
                    <div className="stat-value">
                        {avgWorkingHours.toFixed(1)}h
                    </div>
                </div>
            </div>

        </div>
    )
}

export default SummaryCards