import Datepicker from "react-tailwindcss-datepicker"

function FilterBar({
    filterButtons,
    selectedFilter,
    setSelectedFilter,
    dateRange,
    setDateRange
}) {
        const getBusinessDate = (offset = 0) => {
        const now = new Date()

        const japanTime = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Tokyo"
            })
        )

        if (japanTime.getHours() < 6) {
            japanTime.setDate(japanTime.getDate() - 1)
        }

        japanTime.setDate(japanTime.getDate() - offset)

        return japanTime
    }

    const formatDate = (date) => {
        return date.toLocaleDateString("en-CA")
    }

    const getRangeByFilter = (filter) => {
        const today = getBusinessDate(0)

        let startDate = new Date(today)
        let endDate = new Date(today)

        if (filter === "Yesterday") {
            startDate = getBusinessDate(1)
            endDate = getBusinessDate(1)
        }

        if (filter === "Last 7 Days") {
            startDate.setDate(today.getDate() - 6)
        }

        if (filter === "Last 30 Days") {
            startDate.setDate(today.getDate() - 29)
        }

        if (filter === "This Month") {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        }

        if (filter === "Last Month") {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        }

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">

            {filterButtons.map((item) => (
                <button
                    key={item}
                    className={`btn btn-sm ${
                        selectedFilter === item
                            ? "btn-primary"
                            : "btn-outline"
                    }`}
                    onClick={() => {
                        setSelectedFilter(item)

                        const range = getRangeByFilter(item)

                        setDateRange({
                            startDate: range.startDate,
                            endDate: range.endDate
                        })
                    }}
                >
                    {item}
                </button>
            ))}

            <div className="w-[320px] relative z-50">
                <Datepicker
                    value={dateRange}
                    onChange={(newValue) => {
                        setDateRange(newValue)
                        setSelectedFilter("Custom")
                    }}
                    showShortcuts={true}
                    primaryColor="indigo"
                    useRange={true}
                    separator="~"
                    displayFormat="YYYY-MM-DD"
                />
            </div>

        </div>
    )
}

export default FilterBar