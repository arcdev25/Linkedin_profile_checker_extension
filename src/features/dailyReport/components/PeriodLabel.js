function PeriodLabel({ selectedFilter, dateRange }) {

    const { startDate, endDate } = dateRange

    const label =
        startDate === endDate
            ? startDate
            : `${startDate} ~ ${endDate}`

    return (
        <div className="text-sm opacity-70 mb-4">
            Showing reports for:{" "}
            <span className="font-bold">
                {label}
            </span>
        </div>
    )
}

export default PeriodLabel