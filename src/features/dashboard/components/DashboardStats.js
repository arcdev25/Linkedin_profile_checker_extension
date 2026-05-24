import { useState, useRef } from 'react'

function DashboardStats({ title, icon, value, description, colorIndex, tooltip }) {

    const COLORS = ["primary", "primary"]
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const cardRef = useRef(null)

    const getDescStyle = () => {
        if (description.includes("↗︎")) return "font-bold text-green-700 dark:text-green-300"
        else if (description.includes("↙")) return "font-bold text-rose-500 dark:text-red-400"
        else return ""
    }

    const handleMouseEnter = () => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setPos({
            top: rect.top + window.scrollY - 8,   // above the card
            left: rect.left + rect.width / 2
        })
        setVisible(true)
    }

    const handleMouseLeave = () => setVisible(false)

    return (
        <>
            <div
                ref={cardRef}
                className="stats shadow"
                onMouseEnter={tooltip ? handleMouseEnter : undefined}
                onMouseLeave={tooltip ? handleMouseLeave : undefined}
            >
                <div className="stat">
                    <div className={`stat-figure dark:text-slate-300 text-${COLORS[colorIndex % 2]}`}>{icon}</div>
                    <div className="stat-title dark:text-slate-300">{title}</div>
                    <div className={`stat-value dark:text-slate-300 text-${COLORS[colorIndex % 2]}`}>{value}</div>
                    <div className={"stat-desc  " + getDescStyle()}>{description}</div>
                </div>
            </div>

            {tooltip && visible && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: pos.top,
                        left: pos.left,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-base-300 border border-base-content/20 rounded-xl shadow-xl p-3 text-sm w-56">
                        <p className="font-bold text-base-content mb-2 border-b border-base-content/10 pb-1">
                            {title} breakdown
                        </p>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-base-content/70">Contacted today</span>
                            <span className="font-bold text-primary">{tooltip.new}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-base-content/70">Contacted past</span>
                            <span className="font-bold text-secondary">{tooltip.past}</span>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-3 h-3 bg-base-300 border-r border-b border-base-content/20 rotate-45 mx-auto -mt-1.5" />
                </div>
            )}
        </>
    )
}

export default DashboardStats
