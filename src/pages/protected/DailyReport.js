import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import DailyReport from '../../features/dailyReport/index'

function DailyReportPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Daily Report" }))
    }, [])

    return(
        <DailyReport />
    )
}

export default DailyReportPage