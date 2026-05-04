import moment from "moment"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../components/Cards/TitleCard"
import { getCandidatesContent } from "./candidatesSlice"
import FunnelIcon from '@heroicons/react/24/outline/FunnelIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import SearchBar from "../../components/Input/SearchBar"
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import { openModal } from "../common/modalSlice"
import { CONFIRMATION_MODAL_CLOSE_TYPES, MODAL_BODY_TYPES } from '../../utils/globalConstantUtil'

const TopSideButtons = ({removeFilter, applyFilter, applySearch, openAddModal}) => {
    const [filterParam, setFilterParam] = useState("")
    const [searchText, setSearchText] = useState("")
    const statusFilters = ["pending", "chatting", "sent js", "not interested", "success", "failed", "ghosted"]

    const showFiltersAndApply = (params) => {
        applyFilter(params)
        setFilterParam(params)
    }

    const removeAppliedFilter = () => {
        removeFilter()
        setFilterParam("")
        setSearchText("")
    }

    useEffect(() => {
        if(searchText === ""){
            removeAppliedFilter()
        }else{
            applySearch(searchText)
        }
    }, [searchText])

    return(
        <div className="inline-block float-right">
            <SearchBar searchText={searchText} styleClass="mr-4" setSearchText={setSearchText}/>
            {filterParam !== "" && <button onClick={() => removeAppliedFilter()} className="btn btn-xs mr-2 btn-active btn-ghost normal-case">{filterParam}<XMarkIcon className="w-4 ml-2"/></button>}
            <div className="dropdown dropdown-bottom dropdown-end  mr-4">
                <label tabIndex={0} className="btn btn-sm btn-outline"><FunnelIcon className="w-5 mr-2"/>Filter</label>
                <ul tabIndex={0} className="dropdown-content menu p-2 text-sm shadow bg-base-100 rounded-box w-52">
                    {
                        statusFilters.map((l, k) => {
                            return  <li key={k}><a onClick={() => showFiltersAndApply(l)}>{l}</a></li>
                        })
                    }
                    <div className="divider mt-0 mb-0"></div>
                    <li><a onClick={() => removeAppliedFilter()}>Remove Filter</a></li>
                </ul>
            </div>
            <button className="btn px-6 btn-sm normal-case btn-primary" onClick={() => openAddModal()}>Add New</button>
        </div>
    )
}

function Candidates(){
    const { candidates, isLoading } = useSelector(state => state.candidates)
    const dispatch = useDispatch()
    const [filteredCandidates, setFilteredCandidates] = useState([])

    useEffect(() => {
        dispatch(getCandidatesContent())
    }, [dispatch])

    useEffect(() => {
        setFilteredCandidates(candidates)
    }, [candidates])

    const removeFilter = () => {
        setFilteredCandidates(candidates)
    }

    const applyFilter = (params) => {
        let filtered = candidates.filter((c) => c.status === params)
        setFilteredCandidates(filtered)
    }

    const applySearch = (value) => {
        let filtered = candidates.filter((c) => {
            return c.name.toLowerCase().includes(value.toLowerCase()) || 
                   c.email?.toLowerCase().includes(value.toLowerCase()) ||
                   c.headline?.toLowerCase().includes(value.toLowerCase())
        })
        setFilteredCandidates(filtered)
    }

    const openAddNewCandidateModal = () => {
        dispatch(openModal({title : "Add New Candidate", bodyType : MODAL_BODY_TYPES.CANDIDATE_ADD_NEW}))
    }

    const deleteCurrentCandidate = (id) => {
        dispatch(openModal({
            title : "Confirmation", 
            bodyType : MODAL_BODY_TYPES.CONFIRMATION, 
            extraObject : { 
                message : `Are you sure you want to delete this candidate?`, 
                type : CONFIRMATION_MODAL_CLOSE_TYPES.CANDIDATE_DELETE, 
                id
            }
        }))
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': 'badge-warning',
            'chatting': 'badge-info',
            'sent js': 'badge-primary',
            'not interested': 'badge-error',
            'success': 'badge-success',
            'failed': 'badge-error',
            'ghosted': 'badge-ghost',
            'not contacted': 'badge-ghost'
        }
        return <div className={`badge ${statusMap[status] || 'badge-ghost'}`}>{status}</div>
    }

    return(
        <>
            <TitleCard 
                title="Candidates" 
                topMargin="mt-2" 
                TopSideButtons={
                    <TopSideButtons 
                        applySearch={applySearch} 
                        applyFilter={applyFilter} 
                        removeFilter={removeFilter}
                        openAddModal={openAddNewCandidateModal}
                    />
                }
            >
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Headline</th>
                            <th>Status</th>
                            <th>Recruiter</th>
                            <th>Last Contact</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center">Loading...</td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No candidates found</td>
                                </tr>
                            ) : (
                                filteredCandidates.map((candidate, k) => {
                                    return(
                                        <tr key={candidate.id}>
                                        <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="avatar">
                                                    <div className="mask mask-circle w-12 h-12">
                                                        <img src={candidate.avatar_url || "https://i.pravatar.cc/150?img=1"} alt="Avatar" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">{candidate.name}</div>
                                                    <div className="text-sm opacity-50">
                                                        <a href={candidate.profile_url} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                            LinkedIn
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="max-w-xs truncate">{candidate.headline || 'N/A'}</div>
                                        </td>
                                        <td>{getStatusBadge(candidate.status)}</td>
                                        <td>{candidate.recruiterName}</td>
                                        <td>{moment(candidate.lastContactDate).format("DD MMM YY")}</td>
                                        <td>
                                            <button className="btn btn-square btn-ghost" onClick={() => deleteCurrentCandidate(candidate.id)}>
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
            </TitleCard>
        </>
    )
}

export default Candidates
