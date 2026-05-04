import DashboardStats from './components/DashboardStats'
import AmountStats from './components/AmountStats'
import PageStats from './components/PageStats'

import ChatBubbleBottomCenterIcon  from '@heroicons/react/24/outline/ChatBubbleBottomCenterIcon'
import UsersIcon  from '@heroicons/react/24/outline/UsersIcon'
import CircleStackIcon  from '@heroicons/react/24/outline/CircleStackIcon'
import HandThumbDownIcon  from '@heroicons/react/24/outline/HandThumbDownIcon'
import UserChannels from './components/UserChannels'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon'
import LineChart from './components/LineChart'
import BarChart from './components/BarChart'
import DashboardTopBar from './components/DashboardTopBar'
import { useDispatch, useSelector } from 'react-redux'
import {showNotification} from '../common/headerSlice'
import DoughnutChart from './components/DoughnutChart'
import { useEffect } from 'react'
import { getDashboardStats } from './dashboardSlice'

function Dashboard(){
    const dispatch = useDispatch()
    const { stats, isLoading } = useSelector(state => state.dashboard)

    useEffect(() => {
        dispatch(getDashboardStats())
    }, [dispatch])

    const statsData = [
        {
            title: "Total Profiles", 
            value: stats.totalProfiles.toString(), 
            icon: <UsersIcon className='w-8 h-8'/>, 
            description: `${stats.totalContacts} contacts made`
        },
        {
            title: "Pending", 
            value: (stats.statusCounts.pending || 0).toString(), 
            icon: <CircleStackIcon className='w-8 h-8'/>, 
            description: "Awaiting response"
        },
        {
            title: "Chatting", 
            value: (stats.statusCounts.chatting || 0).toString(), 
            icon: <ChatBubbleBottomCenterIcon className='w-8 h-8'/>, 
            description: "Active conversations"
        },
        {
            title: "Not Interested", 
            value: (stats.statusCounts['not interested'] || 0).toString(), 
            icon: <HandThumbDownIcon className='w-8 h-8'/>, 
            description: "Declined offers"
        },
        {
            title: "Failed", 
            value: (stats.statusCounts.failed || 0).toString(), 
            icon: <ExclamationTriangleIcon className='w-8 h-8'/>, 
            description: "Failed attempts"
        },
        {
            title: "Success", 
            value: (stats.statusCounts.success || 0).toString(), 
            icon: <CheckCircleIcon className='w-8 h-8'/>, 
            description: "↗︎ Successful conversions"
        },
    ]

    const updateDashboardPeriod = (newRange) => {
        dispatch(showNotification({message : `Period updated to ${newRange.startDate} to ${newRange.endDate}`, status : 1}))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading dashboard...</div>
            </div>
        )
    }

    return(
        <>
        {/** ---------------------- Select Period Content ------------------------- */}
            <DashboardTopBar updateDashboardPeriod={updateDashboardPeriod}/>
        
        {/** ---------------------- Different stats content 1 ------------------------- */}
            <div className="grid lg:grid-cols-6 mt-2 md:grid-cols-2 grid-cols-1 gap-6">
                {
                    statsData.map((d, k) => {
                        return (
                            <DashboardStats key={k} {...d} colorIndex={k}/>
                        )
                    })
                }
            </div>

        {/** ---------------------- Different charts ------------------------- */}
            <div className="grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
                <LineChart />
                <BarChart />
            </div>
            
        {/** ---------------------- Different stats content 2 ------------------------- */}
        
            <div className="grid lg:grid-cols-2 mt-10 grid-cols-1 gap-6">
                <AmountStats />
                <PageStats />
            </div>

        {/** ---------------------- User source channels table  ------------------------- */}
        
            <div className="grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
                <UserChannels />
                <DoughnutChart />
            </div>
        </>
    )
}

export default Dashboard