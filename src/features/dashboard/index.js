import DashboardStats from './components/DashboardStats'

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
import { useEffect, useState } from 'react'
import { getDashboardStats, getAllOwners, setSelectedOwner } from './dashboardSlice'
import moment from 'moment'

const DASHBOARD_TIMEZONE_OFFSET = 180
const dashboardNow = () => moment().utcOffset(DASHBOARD_TIMEZONE_OFFSET)

function Dashboard(){
    const dispatch = useDispatch()
    const { stats, isLoading, owners, selectedOwnerId } = useSelector(state => state.dashboard)
    const { user } = useSelector(state => state.auth)
    const isAdmin = user?.role === 'admin'
    const [dateRange, setDateRange] = useState({
        startDate: dashboardNow().format('YYYY-MM-DD'),
        endDate: dashboardNow().format('YYYY-MM-DD')
    })

    useEffect(() => {
        // Load owners list if admin
        if (isAdmin) {
            dispatch(getAllOwners())
        }
    }, [dispatch, isAdmin])

    // Load stats when the owner or date range changes
    useEffect(() => {
        dispatch(getDashboardStats({ 
            ownerId: selectedOwnerId,
            dateRange: dateRange 
        }))
    }, [dispatch, selectedOwnerId, dateRange])

    const handleOwnerTabClick = (ownerId) => {
        dispatch(setSelectedOwner(ownerId))
    }

    const updateDashboardPeriod = (newDateRange) => {
        setDateRange(newDateRange)
        dispatch(showNotification({
            message: `Data filtered from ${newDateRange.startDate} to ${newDateRange.endDate}`, 
            status: 1
        }))
    }

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading dashboard...</div>
            </div>
        )
    }

    return(
        <>
        {/** ---------------------- Owner Tabs for Admin ------------------------- */}
        {isAdmin && owners.length > 0 && (
            <div className="mb-4">
                <div className="tabs tabs-boxed bg-base-200">
                    <button 
                        className={`tab ${selectedOwnerId === null ? 'tab-active' : ''}`}
                        onClick={() => handleOwnerTabClick(null)}
                    >
                        All Owners
                    </button>
                    {owners.map(owner => (
                        <button 
                            key={owner.id}
                            className={`tab ${selectedOwnerId === owner.id ? 'tab-active' : ''}`}
                            onClick={() => handleOwnerTabClick(owner.id)}
                        >
                            {owner.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/** ---------------------- Select Period Content ------------------------- */}
            <DashboardTopBar dateRange={dateRange} updateDashboardPeriod={updateDashboardPeriod}/>
        
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
            
        {/** ---------------------- User source channels table  ------------------------- */}
        
            <div className="grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
                <UserChannels />
                <DoughnutChart />
            </div>
        </>
    )
}

export default Dashboard
