function PeriodLabel({ selectedFilter, selectedDate }) {

    const label =
        selectedFilter === "Custom" && selectedDate
            ? selectedDate
            : selectedFilter

    return (
        <div className="mb-4 text-sm text-gray-500">
            Showing reports for:
            <span className="font-semibold ml-1">
                {label}
            </span>
        </div>
    )
}

export default PeriodLabel