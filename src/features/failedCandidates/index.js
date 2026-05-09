import moment from "moment"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../components/Cards/TitleCard"
import { getFailedCandidatesContent } from "./failedCandidatesSlice"
import SearchBar from "../../components/Input/SearchBar"
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import { openModal } from "../common/modalSlice"
import { CONFIRMATION_MODAL_CLOSE_TYPES, MODAL_BODY_TYPES } from '../../utils/globalConstantUtil'
import Pagination from "../../components/Pagination/Pagination"

const TopSideButtons = ({searchText, setSearchText}) => {
    return(
        <div className="inline-block float-right">
            <SearchBar searchText={searchText} styleClass="mr-4" setSearchText={setSearchText}/>
        </div>
    )
}

function FailedCandidates(){
    const { candidates, totalCount, isLoading } = useSelector(state => state.failedCandidates)
    const dispatch = useDispatch()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchText, setSearchText] = useState("")
    const itemsPerPage = 10

    useEffect(() => {
        dispatch(getFailedCandidatesContent({ 
            page: currentPage, 
            limit: itemsPerPage,
            searchTerm: searchText
        }))
    }, [dispatch, currentPage, searchText])

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const deleteCurrentCandidate = (id) => {
        dispatch(openModal({
            title : "Confirmation", 
            bodyType : MODAL_BODY_TYPES.CONFIRMATION, 
            extraObject : { 
                message : `Are you sure you want to delete this failed candidate?`, 
                type : CONFIRMATION_MODAL_CLOSE_TYPES.FAILED_CANDIDATE_DELETE, 
                id
            }
        }))
    }

    return(
        <>
            <TitleCard 
                title="Failed Candidates" 
                topMargin="mt-2" 
                TopSideButtons={
                    <TopSideButtons 
                        searchText={searchText}
                        setSearchText={setSearchText}
                    />
                }
            >
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Headline</th>
                            <th>Company</th>
                            <th>Last Contact</th>
                            <th>Notes</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="text-center">Loading...</td>
                                </tr>
                            ) : candidates.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">No failed candidates found</td>
                                </tr>
                            ) : (
                                candidates.map((candidate, index) => {
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1
                                    return(
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
                                        <td>{candidate.recruiterName}</td>
                                        <td>{moment(candidate.lastContactDate).format("DD MMM YY")}</td>
                                        <td>
                                            <div className="max-w-xs truncate">{candidate.notes || 'N/A'}</div>
                                        </td>
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
                
                {/* Pagination */}
                {!isLoading && totalCount > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={totalCount}
                        itemsPerPage={itemsPerPage}
                    />
                )}
            </TitleCard>
        </>
    )
}

export default FailedCandidates
