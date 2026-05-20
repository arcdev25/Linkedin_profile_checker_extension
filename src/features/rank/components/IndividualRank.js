import AvatarRankCarousel from "./AvatarRankCarousel"
import IndividualRankTable from "./IndividualRankTable"
import { useState, useEffect } from "react"
import { supabase } from "../../../app/supabaseClient"

function IndividualRank(){
    const [activeMetric, setActiveMetric] = useState("total")
    const [selectedMonth, setSelectedMonth] = useState(4)
    const [selectedYear, setSelectedYear] = useState(2026)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState([])

    const getBusinessDay = () => {

        const now = new Date()

        const japanTime = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Tokyo"
            })
        )

        if (japanTime.getHours() < 6) {
            japanTime.setDate(japanTime.getDate() - 1)
        }

        japanTime.setDate(japanTime.getDate() - 1)

        return japanTime.getDate()
    }
    const [selectedDay, setSelectedDay] = useState(getBusinessDay())

    const avatarMap = {
        Yura: "/Yura.png",
        Faker: "/Faker.png",
        "0xGiant": "/0xGiant.png",
        "0xStrong": "/0xStrong.png",
        Voldmot: "/Voldmot.png",
        Rape: "/Rape.png"
    }

    const calculateMetricScore = (item, metric) => {

        switch(metric){

            case "connect":
                return Number(item.connect_count || 0)

            case "upload":
                return Number(item.upload_count || 0)

            case "earning":
                return Number(item.earning || 0)

            case "workingTime":
                return Number(item.working_time || 0)

            case "totalAccount":
                return Number(item.total_account || 0)

            case "activeAccount":
                return Number(item.active_account || 0)

            case "total":
            default:
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
    }
    
    const loadMonthlyRanking = async () => {

        setLoading(true)

        try {

            const firstDay = new Date(
                selectedYear,
                selectedMonth,
                1
            )

            const lastDay = new Date(
                selectedYear,
                selectedMonth + 1,
                0
            )

            const startDate = firstDay
                .toISOString()
                .split("T")[0]

            const endDate = lastDay
                .toISOString()
                .split("T")[0]

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

            const userRankMap = {}

            Object.keys(groupedByDate).forEach((date) => {

                const reportsOfDay = groupedByDate[date]

                const rankedReports = reportsOfDay
                    .map((item) => ({
                        ...item,
                        name: item.user_name,
                        score: calculateMetricScore(item, activeMetric)
                    }))
                    .sort((a, b) => b.score - a.score)

                rankedReports.forEach((user, index) => {

                    if (!userRankMap[user.name]) {
                        userRankMap[user.name] = {
                            name: user.name,
                            avatar: avatarMap[user.name],
                            score: 0,
                            mvpCount: 0,
                            dailyRanks: {}
                        }
                    }

                    const day = Number(date.split("-")[2])
                    const rank = index + 1

                    userRankMap[user.name].dailyRanks[day] = rank
                    userRankMap[user.name].score += Number(user.score || 0)

                    if (rank === 1) {
                        userRankMap[user.name].mvpCount += 1
                    }

                })

            })
            const fixedUserOrder = [
                "0xStrong",
                "Yura",
                "Voldmot",
                "Faker",
                "Rape",
                "0xGiant",
            ]

            const finalUsers = fixedUserOrder.map((name, index) => {
                return userRankMap[name] || {
                    name,
                    avatar: avatarMap[name],
                    score: 0,
                    mvpCount: 0,
                    dailyRanks: {},
                    level: 50 - index
                }
            })

            setUsers(finalUsers)

        } catch (error) {

            console.error(error)

        } finally {

            setLoading(false)

        }

    }

    useEffect(() => {

        loadMonthlyRanking()

    }, [
        selectedMonth,
        selectedYear,
        activeMetric
    ])
   
    const carouselUsers = users.map((user) => {
        const selectedRank = user.dailyRanks?.[selectedDay]

        return {
            ...user,
            score: selectedRank ? 999 - selectedRank : 0
        }
    })

    return(
        <div className="p-6">
            <h3 className="text-4xl font-bold mb-6">
                Individual Rank
            </h3>

            <AvatarRankCarousel users={carouselUsers} />
            <div className="flex flex-wrap justify-between gap-3 mb-8">

                {[
                    { key: "total", label: "Total" },
                    { key: "connect", label: "Connect" },
                    { key: "upload", label: "Upload" },
                    { key: "earning", label: "Earning" },
                    { key: "workingTime", label: "Working Time" },
                    { key: "totalAccount", label: "Total Account" },
                    { key: "activeAccount", label: "Active Account" }
                ].map((item) => {

                    const active = activeMetric === item.key

                    return (
                        <button
                            key={item.key}
                            onClick={() => setActiveMetric(item.key)}
                            className={`
                                px-4
                                py-2
                                rounded-xl
                                font-bold
                                text-sm
                                tracking-wide
                                transition-all
                                duration-300
                                border

                                ${
                                    active
                                        ? `
                                            bg-gradient-to-r
                                            from-yellow-400
                                            via-amber-300
                                            to-yellow-500
                                            text-black
                                            border-yellow-200
                                            scale-105
                                            shadow-[0_0_25px_#facc15]
                                        `
                                        : `
                                            bg-base-200
                                            text-base-content
                                            border-base-300
                                            hover:scale-105
                                            hover:border-warning
                                            hover:text-warning
                                        `
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    )
                })}

            </div>
            {loading ? (

                <div className="
                    bg-[#0b1020]
                    rounded-3xl
                    p-6
                    border
                    border-purple-500/30
                    animate-pulse
                ">

                    <div className="
                        h-10
                        w-72
                        bg-purple-500/20
                        rounded-xl
                        mb-8
                    " />

                    <div className="space-y-5">

                        {[1,2,3,4,5].map((item) => (

                            <div
                                key={item}
                                className="
                                    h-20
                                    rounded-2xl
                                    bg-purple-500/10
                                "
                            />

                        ))}

                    </div>

                </div>

            ) : (

                <IndividualRankTable
                    users={users}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    activeMetric={activeMetric}
                    setSelectedMonth={setSelectedMonth}
                    setSelectedYear={setSelectedYear}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                />

            )}
        </div>
    )
}

export default IndividualRank