import moment from "moment"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../components/Cards/TitleCard"
import { getCandidatesContent, getNeedReconnectionCandidates, downloadCandidatesCSV, updateContactStatus } from "./candidatesSlice"
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import ArrowDownTrayIcon from '@heroicons/react/24/outline/ArrowDownTrayIcon'
import { openModal } from "../common/modalSlice"
import { CONFIRMATION_MODAL_CLOSE_TYPES, MODAL_BODY_TYPES } from '../../utils/globalConstantUtil'
import Pagination from "../../components/Pagination/Pagination"
import { getAllOwners } from "../accounts/accountSlice"

const STATUS_OPTIONS = ["pending", "accept", "chatting", "sent js", "not interested", "success", "failed"]

const TopSideButtons = ({
    activeTab,
    searchText, setSearchText,
    noteSearch, setNoteSearch,
    statusFilter, setStatusFilter,
    companyFilter, setCompanyFilter,
    onClearAll,
    onDownload,
    downloading
}) => {
    const hasFilter = statusFilter || companyFilter || searchText || noteSearch

    return (
        <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Profile search */}
            <input
                type="text"
                placeholder="Search name, headline, URL…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="input input-bordered input-sm w-48"
            />

            {/* Note search */}
            <input
                type="text"
                placeholder="Search notes…"
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
                className="input input-bordered input-sm w-36"
            />

            {/* Company filter */}
            <input
                type="text"
                placeholder="Filter by company…"
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="input input-bordered input-sm w-36"
            />

            {/* Status filter — main tab only */}
            {activeTab === 'main' && (
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="select select-bordered select-sm"
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            )}

            {/* Clear all filters */}
            {hasFilter && (
                <button
                    onClick={onClearAll}
                    className="btn btn-xs btn-ghost normal-case"
                    title="Clear all filters"
                >
                    Clear <XMarkIcon className="w-3 ml-1"/>
                </button>
            )}

            {/* Download CSV */}
            <button
                onClick={onDownload}
                disabled={downloading}
                className="btn btn-sm btn-outline normal-case gap-1"
                title="Download CSV"
            >
                {downloading
                    ? <span className="loading loading-spinner loading-xs"/>
                    : <ArrowDownTrayIcon className="w-4 h-4"/>
                }
                {downloading ? 'Exporting…' : 'CSV'}
            </button>
        </div>
    )
}

function Candidates() {
    const { candidates, needReconnection, totalCount, needReconnectionTotalCount, isLoading } = useSelector(state => state.candidates)
    const { owners } = useSelector(state => state.account)
    const { user }   = useSelector(state => state.auth)
    const isAdmin    = user?.role === 'admin'
    const dispatch   = useDispatch()
    const [activeTab,       setActiveTab]       = useState('main')
    const [selectedOwnerId, setSelectedOwnerId] = useState(null)  // null = all owners (admin only)
    const [currentPage,     setCurrentPage]     = useState(1)
    const [searchText,      setSearchText]      = useState("")
    const [noteSearch,      setNoteSearch]      = useState("")
    const [statusFilter,    setStatusFilter]    = useState("")
    const [companyFilter,   setCompanyFilter]   = useState("")
    const [downloading,     setDownloading]     = useState(false)
    const itemsPerPage = 10

    // Load owners list for admin tabs
    useEffect(() => {
        if (isAdmin) dispatch(getAllOwners())
    }, [dispatch, isAdmin])

    // Reset to page 1 on any filter or owner change
    useEffect(() => { setCurrentPage(1) }, [searchText, noteSearch, statusFilter, companyFilter, activeTab, selectedOwnerId])

    useEffect(() => {
        if (activeTab === 'main') {
            dispatch(getCandidatesContent({
                page: currentPage,
                limit: itemsPerPage,
                searchTerm: searchText,
                noteSearch,
                statusFilter,
                companyFilter,
                ownerFilter: selectedOwnerId
            }))
        } else {
            dispatch(getNeedReconnectionCandidates({
                page: currentPage,
                limit: itemsPerPage,
                searchTerm: searchText,
                noteSearch
            }))
        }
    }, [dispatch, currentPage, activeTab, searchText, noteSearch, statusFilter, companyFilter, selectedOwnerId])

    const currentData       = activeTab === 'main' ? candidates : needReconnection
    const currentTotalCount = activeTab === 'main' ? totalCount : needReconnectionTotalCount
    const totalPages        = Math.ceil(currentTotalCount / itemsPerPage)

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setCurrentPage(1)
        setSearchText("")
        setNoteSearch("")
        setStatusFilter("")
        setCompanyFilter("")
    }

    const handleOwnerTabClick = (ownerId) => {
        setSelectedOwnerId(ownerId)
        setCurrentPage(1)
        setSearchText("")
        setNoteSearch("")
        setStatusFilter("")
        setCompanyFilter("")
    }

    const clearAll = () => {
        setSearchText("")
        setNoteSearch("")
        setStatusFilter("")
        setCompanyFilter("")
        setCurrentPage(1)
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const rows = await dispatch(downloadCandidatesCSV({
                searchTerm: searchText,
                noteSearch,
                statusFilter,
                companyFilter,
                activeTab
            })).unwrap()

            if (!rows || rows.length === 0) {
                alert('No data to export.')
                return
            }

            // Build CSV
            const headers = ['Name', 'Headline', 'LinkedIn URL', 'Country', 'Status', 'Company', 'Notes', 'Last Contact']
            const keys    = ['name', 'headline', 'profile_url', 'country', 'status', 'company', 'notes', 'last_contact']

            const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`

            const csvContent = [
                headers.join(','),
                ...rows.map(row => keys.map(k => escape(row[k])).join(','))
            ].join('\n')

            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
            const url  = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href     = url
            link.download = `candidates_${activeTab}_${moment().format('YYYYMMDD_HHmm')}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } finally {
            setDownloading(false)
        }
    }

    const handleStatusChange = (candidate, newStatus) => {
        if (!candidate.contactId || newStatus === candidate.status) return
        dispatch(updateContactStatus({
            contactId: candidate.contactId,
            newStatus
        }))
    }

    const deleteCurrentCandidate = (candidate) => {
        const isReconnection = activeTab === 'reconnection'
        dispatch(openModal({
            title: "Confirmation",
            bodyType: MODAL_BODY_TYPES.CONFIRMATION,
            extraObject: {
                message: isReconnection
                    ? "Remove this candidate from the reconnection list? The profile will remain in the main list."
                    : "Are you sure you want to delete this candidate?",
                type: isReconnection
                    ? CONFIRMATION_MODAL_CLOSE_TYPES.RECONNECTION_CONTACT_DELETE
                    : CONFIRMATION_MODAL_CLOSE_TYPES.CANDIDATE_DELETE,
                id: isReconnection ? candidate.contactId : candidate.id
            }
        }))
    }

    const STATUS_COLORS = {
        'pending':        { border: '#f59e0b', color: '#f59e0b' },  // amber
        'chatting':       { border: '#3b82f6', color: '#3b82f6' },  // blue
        'sent js':        { border: '#8b5cf6', color: '#8b5cf6' },  // purple
        'not interested': { border: '#ef4444', color: '#ef4444' },  // red
        'success':        { border: '#10b981', color: '#10b981' },  // green
        'failed':         { border: '#ef4444', color: '#ef4444' },  // red
        'ghosted':        { border: '#6b7280', color: '#6b7280' },  // gray
        'not contacted':  { border: '#6b7280', color: '#6b7280' },  // gray
        'accept':         { border: '#10b981', color: '#10b981' },  // green
    }

    return (
        <>
            {/* Owner tabs — admin only */}
            {isAdmin && owners && owners.length > 0 && (
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

            {/* Main / Reconnection tabs */}
            <div className="mb-4">
                <div className="tabs tabs-boxed bg-base-200">
                    <button
                        className={`tab ${activeTab === 'main' ? 'tab-active' : ''}`}
                        onClick={() => handleTabChange('main')}
                    >
                        Main
                    </button>
                    <button
                        className={`tab ${activeTab === 'reconnection' ? 'tab-active' : ''}`}
                        onClick={() => handleTabChange('reconnection')}
                    >
                        Need Reconnection {needReconnectionTotalCount > 0 && `(${needReconnectionTotalCount})`}
                    </button>
                </div>
            </div>

            <TitleCard
                title={activeTab === 'main' ? "Candidates" : "Need Reconnection"}
                topMargin="mt-2"
                TopSideButtons={
                    <TopSideButtons
                        activeTab={activeTab}
                        searchText={searchText}       setSearchText={setSearchText}
                        noteSearch={noteSearch}       setNoteSearch={setNoteSearch}
                        statusFilter={statusFilter}   setStatusFilter={setStatusFilter}
                        companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
                        onClearAll={clearAll}
                        onDownload={handleDownload}
                        downloading={downloading}
                    />
                }
            >
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Company</th>
                                <th>Last Contact</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center">Loading...</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan="7" className="text-center">No candidates found</td></tr>
                            ) : (
                                currentData.map((candidate, index) => {
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1
                                    return (
                                        <tr key={candidate.id}>
                                            <td>{rowNumber}</td>
                                            <td>
                                                <div className="flex items-center space-x-3">
                                                    <div className="avatar">
                                                        <div className="mask mask-circle w-12 h-12">
                                                            <img src={candidate.avatar_url || "https://i.pravatar.cc/150?img=1"} alt="Avatar" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{candidate.name}</div>
                                                        <div className="text-sm opacity-50 max-w-xs truncate">
                                                            {candidate.headline || 'N/A'}
                                                        </div>
                                                        {candidate.notes && (
                                                            <div className="text-xs text-gray-500 italic max-w-xs truncate" title={candidate.notes}>
                                                                Note: {candidate.notes}
                                                            </div>
                                                        )}
                                                        <div className="text-sm opacity-50">
                                                            <a href={candidate.profile_url} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                                LinkedIn
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{candidate.location || 'Unknown'}</td>
                                            <td>
                                                <select
                                                    value={candidate.status}
                                                    onChange={e => handleStatusChange(candidate, e.target.value)}
                                                    className="select select-bordered select-xs font-semibold"
                                                    style={{
                                                        borderColor: STATUS_COLORS[candidate.status]?.border || '#6b7280',
                                                        color:       STATUS_COLORS[candidate.status]?.color  || '#6b7280',
                                                    }}
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s} value={s} style={{ color: 'inherit' }}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{candidate.recruiterName}</td>
                                            <td>{moment(candidate.lastContactDate).utcOffset(180).format("DD MMM HH:mm")}</td>
                                            <td>
                                                <button className="btn btn-square btn-ghost btn-sm" onClick={() => deleteCurrentCandidate(candidate)}>
                                                    <TrashIcon className="w-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && currentTotalCount > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={currentTotalCount}
                        itemsPerPage={itemsPerPage}
                    />
                )}
            </TitleCard>
        </>
    )
}

export default Candidates
