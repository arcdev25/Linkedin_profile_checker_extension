import { useState } from "react"

function useDailyReports() {

    const [reports, setReports] = useState([])

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState(null)

    return {
        reports,
        setReports,
        loading,
        setLoading,
        error,
        setError
    }
}

export default useDailyReports