function MonthlyTeamBattle({
    battleHistory,
    selectedMonth,
    selectedYear,
    selectedDay,
    setSelectedDay
}){

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

        return japanTime.toLocaleDateString("en-CA")
    }

    const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
    ).getDate()

    const days = Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
    )

    const yuraWins = Object.values(battleHistory).filter(
        (winner) => winner === "Yura"
    ).length

    const strongWins = Object.values(battleHistory).filter(
        (winner) => winner === "0xStrong"
    ).length

    const currentBusinessDay = (() => {

        const businessDate = getBusinessDate()

        return Number(
            businessDate.split("-")[2]
        )

    })()

    return(
        <div className="bg-base-200 rounded-2xl p-3 shadow mb-6">

            <h4 className="font-bold text-xl mb-4">
                Monthly Team Battle Result
            </h4>

            <div className="w-full overflow-hidden">
                <table className="w-full table-fixed text-center">

                    <thead>
                        <tr>
                            <th className="w-28 text-left text-xs">
                                Team
                            </th>

                            {days.map((day) => (
                                <th
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`
                                        text-center
                                        text-[10px]
                                        px-0
                                        transition-all
                                        duration-200

                                        ${
                                            day <= currentBusinessDay
                                                ? "cursor-pointer hover:text-primary hover:scale-110"
                                                : "opacity-20 cursor-not-allowed"
                                        }

                                        ${
                                            selectedDay === day
                                                ? "text-warning scale-125 drop-shadow-[0_0_6px_#ffd700]"
                                                : ""
                                        }
                                    `}
                                >
                                    {day}
                                </th>
                            ))}

                            <th className="w-12 text-xs">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="w-28 font-bold text-success text-xs text-left">
                                Yura Team
                            </td>

                            {days.map((day) => {
                                const winner = battleHistory[day]

                                return (
                                    <td key={day} className="text-center">
                                        {winner === "Yura" && (
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    text-lg
                                                    drop-shadow-[0_0_6px_#ffd700]
                                                "
                                            >
                                                👑
                                            </span>
                                        )}
                                        {winner === "0xStrong" && (
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    text-lg
                                                    drop-shadow-[0_0_6px_#ff3366]
                                                "
                                            >
                                                💔
                                            </span>
                                        )}
                                        {(!winner || winner === "none" || winner === "draw") && (
                                            <span className="text-xs opacity-40">
                                                -
                                            </span>
                                        )}
                                    </td>
                                )
                            })}

                            <td className="w-12 font-bold text-success text-sm">
                                {yuraWins}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-28 font-bold text-error text-xs text-left">
                                0xStrong Team
                            </td>

                            {days.map((day) => {
                                const winner = battleHistory[day]

                                return (
                                    <td key={day} className="text-center">
                                        {winner === "0xStrong" && (
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    text-lg
                                                    drop-shadow-[0_0_6px_#ffd700]
                                                "
                                            >
                                                👑
                                            </span>
                                        )}
                                        {winner === "Yura" && (
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    text-lg
                                                    drop-shadow-[0_0_6px_#ff3366]
                                                "
                                            >
                                                💔
                                            </span>
                                        )}
                                       {(!winner || winner === "none" || winner === "draw") && (
                                            <span className="text-xs opacity-40">
                                                -
                                            </span>
                                        )}
                                    </td>
                                )
                            })}

                            <td className="w-12 font-bold text-success text-sm">
                                {strongWins}
                            </td>
                        </tr>
                    </tbody>

                </table>
            </div>

        </div>
    )
}

export default MonthlyTeamBattle