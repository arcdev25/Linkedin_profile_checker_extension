import moment from "moment"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../components/Cards/TitleCard"
import { openModal } from "../common/modalSlice"
import { getAccountsContent } from "./accountSlice"
import { CONFIRMATION_MODAL_CLOSE_TYPES, MODAL_BODY_TYPES } from '../../utils/globalConstantUtil'
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import PencilIcon from '@heroicons/react/24/outline/PencilIcon'
import Pagination from "../../components/Pagination/Pagination"
import { setSelectedOwner, getAllOwners } from "./accountSlice"

const TopSideButtons = ({ searchText, setSearchText, openAddModal }) => {
    return (
        <div className="flex items-center gap-2 justify-end">
            <input
                type="text"
                placeholder="Search name, email, company…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="input input-bordered input-sm w-56"
            />
            <button className="btn px-6 btn-sm normal-case btn-primary" onClick={openAddModal}>
                Add New
            </button>
        </div>
    )
}

function Accounts(){
    const { user } = useSelector(state => state.auth)
    const { accounts, totalCount, isLoading, owners, selectedOwnerId } = useSelector(state => state.account)
    const isAdmin = user?.role === 'admin'
    const dispatch = useDispatch()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchText, setSearchText] = useState("")
    const itemsPerPage = 10

    // Reset to page 1 when search changes
    useEffect(() => { setCurrentPage(1) }, [searchText, selectedOwnerId])

    useEffect(() => {
        dispatch(getAllOwners())
    }, [dispatch])

    useEffect(() => {
        dispatch(getAccountsContent({ page: currentPage, limit: itemsPerPage, ownerId: selectedOwnerId, searchTerm: searchText }))
    }, [dispatch, selectedOwnerId, currentPage, searchText])
    const openAddNewAccountModal = () => {
        dispatch(openModal({title : "Add New Recruiter", bodyType : MODAL_BODY_TYPES.ACCOUNT_ADD_NEW}))
    }

    const handleOwnerTabClick = (ownerId) => {
            dispatch(setSelectedOwner(ownerId))
        }
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const deleteCurrentAccount = (id) => {
        dispatch(openModal({
            title : "Confirmation", 
            bodyType : MODAL_BODY_TYPES.CONFIRMATION, 
            extraObject : { 
                message : `Are you sure you want to delete this recruiter?`, 
                type : CONFIRMATION_MODAL_CLOSE_TYPES.ACCOUNT_DELETE, 
                id
            }
        }))
    }

    const editCurrentAccount = (account) => {
        dispatch(openModal({
            title : "Edit Recruiter", 
            bodyType : MODAL_BODY_TYPES.ACCOUNT_EDIT,
            extraObject : account
        }))
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
            <TitleCard title="Recruiters" totalCount={totalCount} topMargin="mt-2" TopSideButtons={
                <TopSideButtons
                    searchText={searchText}
                    setSearchText={setSearchText}
                    openAddModal={openAddNewAccountModal}
                />
            }>
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Created At</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center">Loading...</td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No recruiters found</td>
                                </tr>
                            ) : (
                                accounts.map((account, index) => {
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1
                                    return(
                                        <tr key={account.id}>
                                        <td>{rowNumber}</td>
                                        <td>
                                            <div className="font-bold">{account.name}</div>
                                        </td>
                                        <td>{account.email || 'N/A'}</td>
                                        <td>{account.company || 'N/A'}</td>
                                        <td>{moment(account.created_at).format("DD MMM YY")}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-square btn-ghost btn-sm" onClick={() => editCurrentAccount(account)}>
                                                    <PencilIcon className="w-5"/>
                                                </button>
                                                <button className="btn btn-square btn-ghost btn-sm" onClick={() => deleteCurrentAccount(account.id)}>
                                                    <TrashIcon className="w-5"/>
                                                </button>
                                            </div>
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

export default Accounts