import { useState } from "react"

function MonthlyTeamBattle({
    battleHistory,
    selectedMonth,
    selectedYear,
    selectedDay,
    setSelectedDay,
}){

    const [hoveredBattle, setHoveredBattle] = useState(null)
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

    const getWinner = (battle) => {
        return typeof battle === "string"
            ? battle
            : battle?.winner
    }

    const yuraWins = Object.values(battleHistory).filter(
        (battle) =>
            getWinner(battle) === "Yura" &&
            battle?.type !== "weekly"
    ).length

    const strongWins = Object.values(battleHistory).filter(
        (battle) =>
            getWinner(battle) === "0xStrong" &&
            battle?.type !== "weekly"
    ).length

    const currentBusinessDay = (() => {

        const businessDate = getBusinessDate()

        return Number(
            businessDate.split("-")[2]
        )

    })()

    return(
        <div className="bg-base-200 rounded-2xl p-3 shadow mb-6 overflow-visible">

            <h4 className="font-bold text-xl mb-4">
                Monthly Team Battle Result
            </h4>

            <div className="w-full overflow-visible">
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
                                const battle = battleHistory[day]
                                const winner = typeof battle === "string" ? battle : battle?.winner

                                return (
                                    <td
                                        key={day}
                                        className="relative text-center"
                                        onMouseEnter={() =>
                                            setHoveredBattle({
                                                day,
                                                team: "Yura",
                                                battle
                                            })
                                        }
                                        onMouseLeave={() =>
                                            setHoveredBattle(null)
                                        }
                                    >
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
                                                {battle?.type === "weekly" ? "🏆" : "👑"}
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
                                                {battle?.type === "weekly" ? "☠️" : "💔"}
                                            </span>
                                        )}
                                        {hoveredBattle?.day === day &&
                                            hoveredBattle?.team === "Yura" &&
                                            battle && (
                                            <div
                                                className="
                                                    absolute
                                                    z-50
                                                    left-1/2
                                                    -translate-x-1/2
                                                    top-full mt-2

                                                    min-w-[210px]

                                                    rounded-2xl
                                                    border
                                                    border-yellow-400/30

                                                    bg-[#0f172a]/95
                                                    backdrop-blur-md

                                                    px-4
                                                    py-3

                                                    shadow-[0_0_30px_rgba(250,204,21,0.25)]

                                                    text-xs
                                                    text-white
                                                "
                                            >
                                                <div className="font-bold text-yellow-300 mb-2 text-center">
                                                    {battle.type === "weekly"
                                                        ? "👑 Weekly Battle"
                                                        : "⚔️ Daily Battle"}
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-cyan-300">
                                                        Yura
                                                    </span>

                                                    <span className="font-bold">
                                                        {Number(
                                                            battle.yuraScore
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between mt-1">
                                                    <span className="text-pink-300">
                                                        0xStrong
                                                    </span>

                                                    <span className="font-bold">
                                                        {Number(
                                                            battle.strongScore
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
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
                                const battle = battleHistory[day]
                                const winner = typeof battle === "string" ? battle : battle?.winner

                                return (
                                    <td
                                        key={day}
                                        className="relative text-center"
                                        onMouseEnter={() =>
                                            setHoveredBattle({
                                                day,
                                                team: "0xStrong",
                                                battle
                                            })
                                        }
                                        onMouseLeave={() =>
                                            setHoveredBattle(null)
                                        }
                                    >
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
                                                {battle?.type === "weekly" ? "🏆" : "👑"}
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
                                                {battle?.type === "weekly" ? "☠️" : "💔"}
                                            </span>
                                        )}
                                        {hoveredBattle?.day === day &&
                                            hoveredBattle?.team === "0xStrong" &&
                                            battle && (
                                            <div
                                                className="
                                                    absolute
                                                    z-50
                                                    left-1/2
                                                    -translate-x-1/2
                                                    top-full mt-2

                                                    min-w-[210px]

                                                    rounded-2xl
                                                    border
                                                    border-yellow-400/30

                                                    bg-[#0f172a]/95
                                                    backdrop-blur-md

                                                    px-4
                                                    py-3

                                                    shadow-[0_0_30px_rgba(250,204,21,0.25)]

                                                    text-xs
                                                    text-white
                                                "
                                            >
                                                <div className="font-bold text-yellow-300 mb-2 text-center">
                                                    {battle.type === "weekly"
                                                        ? "👑 Weekly Battle"
                                                        : "⚔️ Daily Battle"}
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-cyan-300">
                                                        Yura
                                                    </span>

                                                    <span className="font-bold">
                                                        {Number(
                                                            battle.yuraScore
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between mt-1">
                                                    <span className="text-pink-300">
                                                        0xStrong
                                                    </span>

                                                    <span className="font-bold">
                                                        {Number(
                                                            battle.strongScore
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
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