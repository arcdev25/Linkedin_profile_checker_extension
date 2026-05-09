import ArrowDownTrayIcon  from '@heroicons/react/24/outline/ArrowDownTrayIcon'
import ShareIcon  from '@heroicons/react/24/outline/ShareIcon'
import EnvelopeIcon  from '@heroicons/react/24/outline/EnvelopeIcon'
import EllipsisVerticalIcon  from '@heroicons/react/24/outline/EllipsisVerticalIcon'
import ArrowPathIcon  from '@heroicons/react/24/outline/ArrowPathIcon'
import CalendarIcon  from '@heroicons/react/24/outline/CalendarIcon'
import { useEffect, useState } from "react"
import Datepicker from "react-tailwindcss-datepicker"
import moment from "moment"

const DASHBOARD_TIMEZONE_OFFSET = 180
const DASHBOARD_TIMEZONE_LABEL = 'UTC+3'
const dashboardNow = () => moment().utcOffset(DASHBOARD_TIMEZONE_OFFSET)

const getPresetDateRange = (preset) => {
    switch(preset) {
        case 'today':
            return {
                startDate: dashboardNow().format('YYYY-MM-DD'),
                endDate: dashboardNow().format('YYYY-MM-DD')
            }
        case 'yesterday':
            return {
                startDate: dashboardNow().subtract(1, 'days').format('YYYY-MM-DD'),
                endDate: dashboardNow().subtract(1, 'days').format('YYYY-MM-DD')
            }
        case 'last7days':
            return {
                startDate: dashboardNow().subtract(6, 'days').format('YYYY-MM-DD'),
                endDate: dashboardNow().format('YYYY-MM-DD')
            }
        case 'last30days':
            return {
                startDate: dashboardNow().subtract(29, 'days').format('YYYY-MM-DD'),
                endDate: dashboardNow().format('YYYY-MM-DD')
            }
        case 'thisMonth':
            return {
                startDate: dashboardNow().startOf('month').format('YYYY-MM-DD'),
                endDate: dashboardNow().endOf('month').format('YYYY-MM-DD')
            }
        case 'lastMonth':
            return {
                startDate: dashboardNow().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                endDate: dashboardNow().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
            }
        default:
            return null
    }
}

const getActivePreset = (dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) return null

    return ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth']
        .find((preset) => {
            const presetRange = getPresetDateRange(preset)
            return presetRange.startDate === dateRange.startDate && presetRange.endDate === dateRange.endDate
        }) || null
}

function DashboardTopBar({dateRange, updateDashboardPeriod}){
    const [dateValue, setDateValue] = useState({ 
        startDate: dashboardNow().format('YYYY-MM-DD'), 
        endDate: dashboardNow().format('YYYY-MM-DD')
    })
    
    const [activePreset, setActivePreset] = useState('today')

    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            setDateValue(dateRange)
            setActivePreset(getActivePreset(dateRange))
        }
    }, [dateRange])

    const handleDatePickerValueChange = (newValue) => {
        if (!newValue?.startDate || !newValue?.endDate) return

        setDateValue(newValue)
        setActivePreset(null) // Clear preset when custom date selected
        updateDashboardPeriod(newValue)
    }

    const handlePresetClick = (preset) => {
        const newDateValue = getPresetDateRange(preset)

        if (!newDateValue) return

        setActivePreset(preset)
        setDateValue(newDateValue)
        updateDashboardPeriod(newDateValue)
    }

    const handleRefresh = () => {
        updateDashboardPeriod(dateValue)
    }

    return(
        <div className="mb-4">
            {/* Date Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'today' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('today')}
                    aria-pressed={activePreset === 'today'}
                >
                    Today
                </button>
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('yesterday')}
                    aria-pressed={activePreset === 'yesterday'}
                >
                    Yesterday
                </button>
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'last7days' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('last7days')}
                    aria-pressed={activePreset === 'last7days'}
                >
                    Last 7 Days
                </button>
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'last30days' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('last30days')}
                    aria-pressed={activePreset === 'last30days'}
                >
                    Last 30 Days
                </button>
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'thisMonth' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('thisMonth')}
                    aria-pressed={activePreset === 'thisMonth'}
                >
                    This Month
                </button>
                <button 
                    className={`btn btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activePreset === 'lastMonth' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePresetClick('lastMonth')}
                    aria-pressed={activePreset === 'lastMonth'}
                >
                    Last Month
                </button>
            </div>

            {/* Date Picker and Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <Datepicker 
                        containerClassName="w-72" 
                        value={dateValue} 
                        theme={"light"}
                        inputClassName="input input-bordered w-72" 
                        popoverDirection={"down"}
                        toggleClassName="invisible"
                        onChange={handleDatePickerValueChange} 
                        showShortcuts={true} 
                        primaryColor={"white"} 
                    /> 
                </div>
                <div className="text-right">
                    <button 
                        className="btn btn-ghost btn-sm normal-case"
                        onClick={handleRefresh}
                    >
                        <ArrowPathIcon className="w-4 mr-2"/>Refresh Data
                    </button>
                    <button className="btn btn-ghost btn-sm normal-case ml-2">
                        <ShareIcon className="w-4 mr-2"/>Share
                    </button>

                    <div className="dropdown dropdown-bottom dropdown-end ml-2">
                        <label tabIndex={0} className="btn btn-ghost btn-sm normal-case btn-square">
                            <EllipsisVerticalIcon className="w-5"/>
                        </label>
                        <ul tabIndex={0} className="dropdown-content menu menu-compact p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a><EnvelopeIcon className="w-4"/>Email Digests</a></li>
                            <li><a><ArrowDownTrayIcon className="w-4"/>Download</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Selected Date Range Display */}
            <div className="mt-2 text-sm text-gray-600">
                Showing data from <span className="font-semibold">{moment(dateValue.startDate, 'YYYY-MM-DD').format('MMM DD, YYYY')}</span> to <span className="font-semibold">{moment(dateValue.endDate, 'YYYY-MM-DD').format('MMM DD, YYYY')}</span> ({DASHBOARD_TIMEZONE_LABEL})
            </div>
        </div>
    )
}

export default DashboardTopBar
