import { useEffect, useState } from "react"
import { supabase } from "../../../app/supabaseClient"

function TotalRank(){

    const [rankData, setRankData] = useState([])

    const avatarMap = {
        Yura: "https://i.pravatar.cc/150?img=12",
        Faker: "https://i.pravatar.cc/150?img=13",
        "0xGiant": "https://i.pravatar.cc/150?img=14",
        "0xStrong": "https://i.pravatar.cc/150?img=15",
        Voldmot: "https://i.pravatar.cc/150?img=16",
        Rape: "https://i.pravatar.cc/150?img=17"
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

    const getRankingDate = () => {

        const now = new Date()

        const japanTime = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Tokyo"
            })
        )

        // Always use previous completed business day
        japanTime.setDate(japanTime.getDate() - 1)

        // Before 6AM, go back one more day
        if (japanTime.getHours() < 6) {
            japanTime.setDate(japanTime.getDate() - 1)
        }

        return japanTime.toLocaleDateString("en-CA")
    }

    const loadRankData = async () => {

        const today = getRankingDate()
        console.log(today)

        const { data, error } = await supabase
            .from("daily_reports")
            .select("*")
            .eq("report_date", today)

        if (error) {
            console.error(error)
            return
        }
        console.log("data", data)
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
    }

    useEffect(() => {
        loadRankData()
    }, [])


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

    const winnerTeam =
        teamAScore >= teamBScore
            ? teamAUsers
            : teamBUsers

    const loserTeam =
        teamAScore >= teamBScore
            ? teamBUsers
            : teamAUsers

    const winnerBoss =
        teamAScore >= teamBScore
            ? "Yura"
            : "0xStrong"

    const loserBoss =
        teamAScore >= teamBScore
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

    const winnerScore = teamAScore >= teamBScore ? teamAScore : teamBScore
    const loserScore = teamAScore >= teamBScore ? teamBScore : teamAScore

    return(
        <div>

            <h3 className="text-lg font-semibold mb-6">
                Total Rank
            </h3>

            {/* Battle Banner */}
            <div className="mb-6 rounded-2xl overflow-hidden shadow">

                <img
                    src={
                        winnerBoss === "Yura"
                            ? "/Yura_win.png"
                            : "/0xStrong_win.png"
                    }
                    alt="Team Battle"
                    className="w-full h-[450px]"
                />

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Total Rank Table */}
                <div className="xl:col-span-4 bg-base-200 rounded-xl p-5">

                    <h3 className="font-bold text-4xl mb-8">
                        Total Ranking
                    </h3>

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
                                        <td>{user.name}</td>
                                        <td>{user.score}</td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

                {/* Winner Team */}
                <div className="xl:col-span-4 bg-base-200 rounded-xl p-5">

                    <h4 className="font-semibold text-success mb-1">
                        🏆 Winner {winnerBoss} Team
                    </h4>
                    {/* <div className="text-sm opacity-70 mb-4">
                        Team Score: {
                            teamAScore >= teamBScore
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
                <div className="xl:col-span-4 bg-base-200 rounded-xl p-5">

                    <h4 className="font-semibold text-error mb-1">
                        💔 Loser {loserBoss} Team
                    </h4>           
                    {/* <div className="text-sm opacity-70 mb-4">
                        Team Score: {
                            teamAScore >= teamBScore
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

        </div>
    )
}

export default TotalRank