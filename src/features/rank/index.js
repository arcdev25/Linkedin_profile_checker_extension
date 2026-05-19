import { useState } from "react"

import TotalRank from "./components/TotalRank"
import IndividualRank from "./components/IndividualRank"

function Rank(){

    const [activeTab, setActiveTab] = useState("total")

    return(
        <div className="p-6">

            <h2 className="text-xl font-semibold mb-4">
                User Ranking
            </h2>

            <div className="bg-base-100 rounded-lg shadow p-6">

                <div className="tabs tabs-boxed mb-6">

                    <button
                        className={`tab ${
                            activeTab === "total"
                                ? "tab-active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("total")}
                    >
                        Total Rank
                    </button>

                    <button
                        className={`tab ${
                            activeTab === "individual"
                                ? "tab-active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("individual")}
                    >
                        Individual Rank
                    </button>

                </div>

                {activeTab === "total" && (
                    <TotalRank />
                )}

                {activeTab === "individual" && (
                    <IndividualRank />
                )}

            </div>

        </div>
    )
}

export default Rank