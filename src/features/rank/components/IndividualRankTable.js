function IndividualRankTable({
    users,
    selectedMonth,
    selectedYear,
    activeMetric,
    setSelectedMonth,
    setSelectedYear,
    selectedDay,
    setSelectedDay
}) {
    const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
    ).getDate()

    const days = Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
    )

    const getRankStyle = (rank) => {
        if (rank === 1) return "text-yellow-300 drop-shadow-[0_0_10px_#facc15]"
        if (rank === 2) return "text-purple-400"
        if (rank === 3) return "text-orange-400"
        return "text-gray-400"
    }

    const getMvpBadgeStyle = (count) => {
        if (count >= 3) return "from-yellow-300 to-orange-500 shadow-[0_0_25px_#facc15]"
        if (count === 2) return "from-purple-400 to-pink-500 shadow-[0_0_25px_#c084fc]"
        if (count === 1) return "from-blue-300 to-cyan-500 shadow-[0_0_25px_#38bdf8]"
        return "from-gray-600 to-gray-800"
    }

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]

    const years = [2024, 2025, 2026, 2027]

    const getBusinessDate = () => {
        const now = new Date()

        const japanTime = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Tokyo"
            })
        )

        if (japanTime.getHours() < 6) {
            japanTime.setDate(japanTime.getDate() - 1)
        }

        return japanTime
    }

    const currentBusinessDate = getBusinessDate()

    const isFutureDay = (day) => {
        const targetDate = new Date(
            selectedYear,
            selectedMonth,
            day
        )

        return targetDate > currentBusinessDate
    }
    

    return (
        <div className="bg-[#0b1020] rounded-3xl p-4 shadow border border-purple-500/40">

            <div className="flex items-center justify-between mb-8 px-2">

                <h3 className="text-3xl font-extrabold">
                    Monthly{" "}
                    <span className="text-yellow-400 capitalize">
                        {activeMetric}
                    </span>{" "}
                    Ranking
                </h3>

                <div className="flex items-center gap-4">

                    <select
                        className="
                            bg-[#111827]
                            text-white
                            border
                            border-yellow-400/40
                            rounded-2xl
                            px-5
                            py-3
                            font-bold
                            shadow-[0_0_18px_rgba(250,204,21,0.25)]
                            outline-none
                            transition-all
                            duration-300
                            hover:border-yellow-400
                            focus:border-yellow-400
                            appearance-none
                            min-w-[160px]
                            cursor-pointer
                        "
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(Number(e.target.value))
                        }
                    >
                        {months.map((month, index) => (
                            <option
                                key={month}
                                value={index}
                                className="
                                    bg-[#111827]
                                    text-white
                                "
                            >
                                {month}
                            </option>
                        ))}
                    </select>

                    <select
                        className="
                            bg-[#111827]
                            text-white
                            border
                            border-purple-400/40
                            rounded-2xl
                            px-5
                            py-3
                            font-bold
                            shadow-[0_0_18px_rgba(168,85,247,0.25)]
                            outline-none
                            transition-all
                            duration-300
                            hover:border-purple-400
                            focus:border-purple-400
                            appearance-none
                            min-w-[120px]
                            cursor-pointer
                        "
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                        }
                    >
                        {years.map((year) => (
                            <option
                                key={year}
                                value={year}
                                className="
                                    bg-[#111827]
                                    text-white
                                "
                            >
                                {year}
                            </option>
                        ))}
                    </select>

                </div>

            </div>

            <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-base-300 pb-16">
                <table className="w-full table-fixed text-center">

                    <thead className="bg-base-300/40">
                        <tr>
                            <th className="w-40 py-3 text-sm">User</th>

                            {days.map((day) => {
                                const disabled = isFutureDay(day)

                                return (
                                    <th
                                        key={day}
                                        onClick={() => {
                                            if (!disabled) {
                                                setSelectedDay(day)
                                            }
                                        }}
                                        className="py-3 text-sm"
                                    >
                                        <div
                                            className={`
                                                inline-flex
                                                items-center
                                                justify-center
                                                w-8
                                                h-5
                                                font-bold
                                                transition-all
                                                duration-300

                                                ${
                                                    disabled
                                                        ? "text-slate-600 cursor-not-allowed opacity-40"
                                                        : "cursor-pointer text-slate-300 hover:text-purple-300 hover:scale-110"
                                                }

                                                ${
                                                    selectedDay === day && !disabled
                                                        ? "text-yellow-300 scale-125 drop-shadow-[0_0_10px_#facc15]"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {day}
                                        </div>
                                    </th>
                                )
                            })}

                            <th className="w-20 py-3 text-sm text-yellow-400 font-['Sora'] font-extrabold">
                                MVP
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user, userIndex) => {
                            const mvpCount = user.mvpCount || 0

                            return (
                                <tr
                                    key={user.name}
                                    className="border-t border-base-300/40"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500 shadow-[0_0_12px_#8b5cf6]"
                                            />

                                            <div className="text-left">
                                                <div className="font-extrabold text-base">
                                                    {user.name}
                                                </div>

                                                <div className="text-xs text-purple-400">
                                                    Lv. {50 - userIndex}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {days.map((day) => {
                                        const rank = user.dailyRanks?.[day]
                                        const score = user.dailyScores?.[day]

                                        return (
                                            <td
                                                key={day}
                                                className="relative py-3 text-base font-extrabold group"
                                            >
                                                {rank ? (
                                                    <div className="relative inline-block">
                                                        <span className={getRankStyle(rank)}>
                                                            {rank === 1 && Number(score || 0) > 0
                                                                ? "👑"
                                                                : Number(score || 0) <= 0
                                                                    ? "☠️"
                                                                : `${rank}`
                                                            }
                                                        </span>

                                                        <div
                                                            className="
                                                                absolute
                                                                z-50
                                                                left-1/2
                                                                -translate-x-1/2
                                                                bottom-full
                                                                mb-2

                                                                hidden
                                                                group-hover:block

                                                                min-w-[150px]
                                                                rounded-xl
                                                                border
                                                                border-yellow-400/30
                                                                bg-[#0f172a]
                                                                px-3
                                                                py-2
                                                                shadow-[0_0_25px_rgba(250,204,21,0.25)]

                                                                text-xs
                                                                text-white
                                                            "
                                                        >
                                                            <div className="text-yellow-300 font-bold mb-1">
                                                                Score
                                                            </div>

                                                            <div className="font-black">
                                                                {Number(score || 0).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="opacity-30">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        )
                                    })}

                                    <td className="py-3">
                                        <div
                                            className={`
                                                relative
                                                mx-auto
                                                w-12
                                                h-12
                                                flex
                                                items-center
                                                justify-center
                                                bg-gradient-to-br
                                                ${getMvpBadgeStyle(mvpCount)}
                                                clip-path-star
                                                animate-pulse
                                            `}
                                        >
                                            <span className="text-xl font-black text-white drop-shadow">
                                                {mvpCount}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>

                </table>
            </div>
        </div>
    )
}

export default IndividualRankTable