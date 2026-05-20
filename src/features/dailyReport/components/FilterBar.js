function FilterBar({
    filterButtons,
    selectedFilter,
    setSelectedFilter,
    selectedDate,
    setSelectedDate
}) {

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
                    onClick={() => setSelectedFilter(item)}
                >
                    {item}
                </button>
            ))}

            <input
                type="date"
                className="input input-sm input-bordered"
                value={selectedDate}
                onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedFilter("Custom")
                }}
            />

        </div>
    )
}

export default FilterBar