import { motion } from "framer-motion"

function AvatarRankCarousel({ users }) {
    const sortedUsers = [...users].sort(
        (a, b) => Number(b.score || 0) - Number(a.score || 0)
    )

    const winner = sortedUsers[0]
    if (!winner) {
        return null
    }
    const others = sortedUsers.slice(1)

    const displayUsers = [
        ...others.slice(0, 2),
        winner,
        ...others.slice(2)
    ]

    return (
        <div className="bg-base-200 rounded-2xl p-6 mb-6 shadow">

            <h3 className="font-bold text-2xl mb-6">
                Daily Top Performer
            </h3>

            <div className="flex items-end justify-between w-full px-8">

                {displayUsers.map((user) => {
                    const isWinner = user.name === winner?.name

                    return (
                        <motion.div
                            key={user.name}
                            layout
                            animate={{
                                scale: isWinner ? 1 : 0.8,
                                opacity: isWinner ? 0.8 : 0.6
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 220,
                                damping: 24
                            }}
                            className={`
                                flex flex-col items-center
                                ${isWinner ? "z-10" : ""}
                            `}
                        >
                            <div
                                className={`
                                    rounded-full p-1
                                    ${
                                        isWinner
                                            ? "bg-warning shadow-[0_0_30px_#facc15]"
                                            : "bg-base-300"
                                    }
                                `}
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className={`
                                        rounded-full object-cover
                                        ${
                                            isWinner
                                                ? "w-32 h-32"
                                                : "w-28 h-28"
                                        }
                                    `}
                                />
                            </div>

                            <div
                                className={`
                                    mt-3 font-bold
                                    ${
                                        isWinner
                                            ? "text-warning text-xl"
                                            : "text-base"
                                    }
                                `}
                            >
                                {user.name}
                            </div>

                            {isWinner && (
                                <div
                                    className="
                                        mt-3
                                        px-5
                                        py-2
                                        rounded-full
                                        bg-gradient-to-r
                                        from-yellow-400
                                        via-amber-300
                                        to-yellow-500
                                        text-black
                                        font-extrabold
                                        text-lg
                                        tracking-widest
                                        shadow-[0_0_25px_#facc15]
                                        animate-pulse
                                        border
                                        border-yellow-200
                                    "
                                >
                                    ✦ MVP ✦
                                </div>
                            )}
                        </motion.div>
                    )
                })}

            </div>
        </div>
    )
}

export default AvatarRankCarousel