import { useEffect, useState } from "react"
import { supabase } from "../../../app/supabaseClient"
import MonthlyTeamBattle from "./MonthlyTeamBattle"

function TotalRank(){

    const [rankData, setRankData] = useState([])
    const [battleHistory, setBattleHistory] = useState({})
    const [rankLoading, setRankLoading] = useState(false)
    const [selectedDay, setSelectedDay] = useState(null)

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth()
    )

    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear()
    )

    const monthNames = [
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

    const avatarMap = {
        Yura: "/Yura.png",
        Faker: "/Faker.png",
        "0xGiant": "/0xGiant.png",
        "0xStrong": "/0xStrong.png",
        Voldmot: "/Voldmot.png",
        Rape: "/Rape.png"
    }

    const bossUsers = ["Yura", "0xStrong"]

    const calculateScore = (item) => {

        return (
            Number(item.connect_count || 0) * 2 +
            Number(item.accept_count || 0) * 5 +
            Number(item.publish_count || 0) * 8 +
            Number(item.upload_count || 0) * 15 +
            Number(item.balance || 0) * 20 +
            Number(item.earning || 0) * 30 +
            Number(item.working_time || 0) * 5 +
            Number(item.active_account || 0) * 10 +
            Number(item.total_account || 0) * 5 -
            Number(item.lost_account || 0) * 10
        )
    }

    const calculateTeamScore = (users) => {

        return users.reduce((sum, user) => {
            return sum + Number(user.score || 0)
        }, 0)
    }

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

    const getRankingDate = () => {
        const businessDate = getBusinessDate()

        const date = new Date(`${businessDate}T00:00:00`)
        date.setDate(date.getDate() - 1)

        return date.toLocaleDateString("en-CA")
    }

    const loadRankData = async () => {
        setRankLoading(true)

        try {
            
            let rankingDate = getRankingDate()
    
            if (selectedDay) {
    
                const month = String(selectedMonth + 1).padStart(2, "0")
    
                const day = String(selectedDay).padStart(2, "0")
    
                rankingDate = `${selectedYear}-${month}-${day}`
            }
    
            const { data, error } = await supabase
                .from("daily_reports")
                .select("*")
                .eq("report_date", rankingDate)
    
            if (error) {
                console.error(error)
                return
            }
            
            const rankedData = data
                .map((item) => ({
                    ...item,
                    name: item.user_name,
                    avatar: avatarMap[item.user_name],
                    isBoss: bossUsers.includes(item.user_name),
                    score: calculateScore(item)
                }))
                .sort((a, b) => b.score - a.score)
                .map((item, index) => ({
                    ...item,
                    rank: index + 1
                }))
    
            setRankData(rankedData)
            
            if (rankedData.length === 0) {
                return
            }

            const teamAUsers = rankedData.filter(user =>
                teamA.includes(user.name)
            )
    
            const teamBUsers = rankedData.filter(user =>
                teamB.includes(user.name)
            )
    
            const teamAScore = calculateTeamScore(teamAUsers)
            const teamBScore = calculateTeamScore(teamBUsers)
    
            const battleDate = Number(
                rankingDate.split("-")[2]
            )
    
            setBattleHistory((prev) => ({
                ...prev,
                [battleDate]:
                    teamAScore > teamBScore
                        ? "Yura"
                        : "0xStrong"
            }))
        } catch (error) {
            console.log(error)            
        } finally {
            setRankLoading(false)
        }
    }

    const formatDate = (date) => {
        return date.toLocaleDateString("en-CA")
    }

    const loadMonthlyBattleHistory = async () => {

        const year = selectedYear
        const month = selectedMonth

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const startDate = formatDate(firstDay)
        const endDate = formatDate(lastDay)

        const { data, error } = await supabase
            .from("daily_reports")
            .select("*")
            .gte("report_date", startDate)
            .lte("report_date", endDate)

        if (error) {
            console.error(error)
            return
        }

        const groupedByDate = {}

        data.forEach((item) => {

            const date = item.report_date

            if (!groupedByDate[date]) {
                groupedByDate[date] = []
            }

            groupedByDate[date].push(item)
        })


        const monthlyHistory = {}

        Object.keys(groupedByDate).forEach((date) => {

            const reportsOfDay = groupedByDate[date]

            const rankedReports = reportsOfDay.map((item) => ({
                ...item,
                name: item.user_name,
                score: calculateScore(item)
            }))

            const teamAUsers = rankedReports.filter((user) =>
                teamA.includes(user.name)
            )

            const teamBUsers = rankedReports.filter((user) =>
                teamB.includes(user.name)
            )

            const teamAScore = calculateTeamScore(teamAUsers)
            const teamBScore = calculateTeamScore(teamBUsers)

            const day = Number(date.split("-")[2])

            if (reportsOfDay.length === 0 || (teamAScore === 0 && teamBScore === 0)) {
                monthlyHistory[day] = "none"
            } else if (teamAScore > teamBScore) {
                monthlyHistory[day] = "Yura"
            } else if (teamBScore > teamAScore) {
                monthlyHistory[day] = "0xStrong"
            } else {
                monthlyHistory[day] = "draw"
            }
        })

        setBattleHistory(monthlyHistory)
    }

    
    useEffect(() => {
        loadRankData()
    }, [selectedDay, selectedMonth, selectedYear])

    useEffect(() => {
        loadMonthlyBattleHistory()
    }, [selectedMonth, selectedYear])

    const teamA = [
        "Yura",
        "Faker",
        "0xGiant"
    ]

    const teamB = [
        "0xStrong",
        "Voldmot",
        "Rape"
    ]

    const teamAUsers = rankData.filter(user =>
        teamA.includes(user.name)
    )

    const teamBUsers = rankData.filter(user =>
        teamB.includes(user.name)
    )

    const teamAScore = teamAUsers.reduce(
        (sum, user) => sum + Number(user.score || 0),
        0
    )

    const teamBScore = teamBUsers.reduce(
        (sum, user) => sum + Number(user.score || 0),
        0
    )

    const hasRankData = rankData.length > 0

    const isDrawOrNoData =
        !hasRankData || teamAScore === teamBScore

    const winnerTeam =
        isDrawOrNoData
            ? []
            : teamAScore > teamBScore
                ? teamAUsers
                : teamBUsers

    const loserTeam =
        isDrawOrNoData
            ? []
            : teamAScore > teamBScore
                ? teamBUsers
                : teamAUsers

    const winnerBoss =
        isDrawOrNoData
            ? null
            : teamAScore > teamBScore
                ? "Yura"
                : "0xStrong"

    const loserBoss =
        isDrawOrNoData
            ? null
            : teamAScore > teamBScore
                ? "0xStrong"
                : "Yura"

    winnerTeam.sort((a, b) => {
        if (a.name === winnerBoss) return -1
        if (b.name === winnerBoss) return 1
        return b.score - a.score
    })

    loserTeam.sort((a, b) => {
        if (a.name === loserBoss) return -1
        if (b.name === loserBoss) return 1
        return b.score - a.score
    })

    const winnerScore = teamAScore > teamBScore ? teamAScore : teamBScore
    const loserScore = teamAScore > teamBScore ? teamBScore : teamAScore

    return(
        <div>

            <div className="flex justify-between items-center mb-8">

                <h3 className="font-bold text-4xl">
                    Total Rank
                </h3>

                <div className="flex gap-3">

                    <select
                        className="select select-bordered"
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(Number(e.target.value))
                        }
                    >

                        {monthNames.map((month, index) => (
                            <option
                                key={month}
                                value={index}
                            >
                                {month}
                            </option>
                        ))}

                    </select>

                    <select
                        className="select select-bordered"
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                        }
                    >

                        {[2025, 2026, 2027].map((year) => (
                            <option
                                key={year}
                                value={year}
                            >
                                {year}
                            </option>
                        ))}

                    </select>

                </div>

            </div>

            {/* Battle Banner */}
            <div className="mb-6 rounded-2xl overflow-hidden shadow">
                
                <img
                    src={
                        winnerBoss === "Yura"
                            ? "/Yura_win.png"
                            : winnerBoss === "0xStrong"
                                ? "/0xStrong_win.png"
                                : "/draw.png"
                    }
                    alt="Team Battle"
                    className="w-full h-[450px]"
                />

            </div>
            <MonthlyTeamBattle
                battleHistory={battleHistory}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
            />
            {rankLoading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* Total Rank Table */}
                    <div className="xl:col-span-4 bg-base-200 rounded-xl p-5">

                        <div className="h-14 flex items-center mb-6">
                            <h4 className="font-bold text-4xl leading-none">
                                Total Ranking
                            </h4>
                        </div>

                        <div className="overflow-x-auto">

                            <table className="table table-zebra w-full">

                                <thead className="text-xl font-bold">
                                    <tr>
                                        <th className="w-20 text-center">No</th>
                                        <th>User</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {rankData.map((user) => (
                                        <tr
                                            key={user.name}
                                            className="text-xl h-10"
                                        >
                                            <td className="w-20 text-center align-middle">
                                                {user.rank === 1 && <span className="text-3xl">🥇</span>}
                                                {user.rank === 2 && <span className="text-3xl">🥈</span>}
                                                {user.rank === 3 && <span className="text-3xl">🥉</span>}
                                                {user.rank > 3 && (
                                                    <span className="text-2xl font-semibold">
                                                        {user.rank}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">

                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="
                                                            w-10
                                                            h-10
                                                            rounded-full
                                                            object-cover
                                                            border
                                                            border-base-300
                                                        "
                                                    />

                                                    <span className="font-semibold">
                                                        {user.name}
                                                    </span>

                                                </div>
                                            </td>
                                            <td>{user.score}</td>
                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* Winner Team */}
                    <div className="
                        xl:col-span-4
                        bg-base-200
                        rounded-2xl
                        px-4
                        pb-4
                        pt-6
                        flex
                        flex-col
                        justify-center
                    ">

                        <div className="h-14 flex items-center mb-6">
                            <h4 className="text-success font-bold text-4xl leading-none">
                                🏆 Winner {winnerBoss} Team
                            </h4>
                        </div>
                        {/* <div className="text-sm opacity-70 mb-4">
                            Team Score: {
                                teamAScore > teamBScore
                                    ? teamAScore
                                    : teamBScore
                            }
                        </div> */}

                        <div className="space-y-4">

                            {winnerTeam.map((user) => (

                                <div
                                    key={user.rank}
                                    className="flex items-center gap-4 bg-base-100 rounded-2xl p-4 border border-base-300 shadow-sm"
                                >

                                    <div className="avatar">
                                        <div className="w-16 h-16 rounded-full ring ring-base-300">
                                            <img src={user.avatar} alt={user.name} />
                                        </div>
                                    </div>

                                    <div className="flex-1">

                                        <div className="flex items-center gap-2">

                                            {user.isBoss && (
                                                <span className="text-warning text-lg">
                                                    👑
                                                </span>
                                            )}

                                            <div className="font-semibold text-base">
                                                {user.name}
                                            </div>

                                            {user.isBoss && (
                                                <span className="badge badge-success badge-sm">
                                                    Master
                                                </span>
                                            )}

                                        </div>

                                        <div className="text-sm opacity-70 mt-1">
                                            Score: {user.score}
                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>
                        
                    <div className="mt-6 bg-base-100 rounded-2xl p-5 border border-base-300 flex justify-between items-center">
                            <span className="font-semibold">Total Score</span>
                            <span className="text-3xl font-bold text-success">
                                {winnerScore.toLocaleString()}
                            </span>
                        </div>

                    </div>

                    {/* Loser Team */}
                    <div className="
                        xl:col-span-4
                        bg-base-200
                        rounded-2xl
                        px-4
                        pb-4
                        pt-6
                        flex
                        flex-col
                        justify-center
                    ">

                        <div className="h-14 flex items-center mb-6">
                            <h4 className="text-error font-bold text-4xl leading-none">
                                💔 Loser {loserBoss} Team
                            </h4>
                        </div>         
                        {/* <div className="text-sm opacity-70 mb-4">
                            Team Score: {
                                teamAScore > teamBScore
                                    ? teamBScore
                                    : teamAScore
                            }
                        </div> */}

                        <div className="space-y-4">

                            {loserTeam.map((user) => (

                                <div
                                    key={user.rank}
                                    className="flex items-center gap-4 bg-base-100 rounded-2xl p-4 border border-base-300 shadow-sm"
                                >

                                    <div className="avatar">
                                        <div className="w-16 h-16 rounded-full ring ring-base-300">
                                            <img src={user.avatar} alt={user.name} />
                                        </div>
                                    </div>

                                    <div className="flex-1">

                                        <div className="flex items-center gap-2">

                                            {user.isBoss && (
                                                <span className="text-warning text-lg">
                                                    👑
                                                </span>
                                            )}

                                            <div className="font-semibold text-base">
                                                {user.name}
                                            </div>

                                            {user.isBoss && (
                                                <span className="badge badge-success badge-sm">
                                                    Master
                                                </span>
                                            )}

                                        </div>

                                        <div className="text-sm opacity-70 mt-1">
                                            Score: {user.score}
                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                        <div className="mt-6 bg-base-100 rounded-2xl p-5 border border-base-300 flex justify-between items-center">
                            <span className="font-semibold">Total Score</span>
                            <span className="text-3xl font-bold text-success">
                                {loserScore.toLocaleString()}
                            </span>
                        </div>

                    </div>

                </div>
            )}

        </div>
    )
}

export default TotalRank