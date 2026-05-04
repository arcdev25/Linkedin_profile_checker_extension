import moment from "moment"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../components/Cards/TitleCard"
import { getOwnersContent, updateOwnerStatus, deleteOwner } from "./ownersSlice"
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import { showNotification } from '../common/headerSlice'
import { openModal } from "../common/modalSlice"
import { CONFIRMATION_MODAL_CLOSE_TYPES, MODAL_BODY_TYPES } from '../../utils/globalConstantUtil'

function Owners(){
    const { owners, isLoading } = useSelector(state => state.owners)
    const { user } = useSelector(state => state.auth)
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getOwnersContent())
    }, [dispatch])

    const toggleOwnerStatus = async (owner) => {
        const newStatus = owner.status === 'active' ? 'disabled' : 'active'
        try {
            await dispatch(updateOwnerStatus({ id: owner.id, status: newStatus })).unwrap()
            dispatch(showNotification({
                message : `Owner ${newStatus === 'active' ? 'activated' : 'disabled'} successfully!`, 
                status : 1
            }))
        } catch (error) {
            dispatch(showNotification({message : "Failed to update status", status : 0}))
        }
    }

    const deleteCurrentOwner = (id) => {
        dispatch(openModal({
            title : "Confirmation", 
            bodyType : MODAL_BODY_TYPES.CONFIRMATION, 
            extraObject : { 
                message : `Are you sure you want to delete this owner? This will also delete all their recruiters.`, 
                type : CONFIRMATION_MODAL_CLOSE_TYPES.OWNER_DELETE, 
                id
            }
        }))
    }

    const getRoleBadge = (role) => {
        return role === 'admin' 
            ? <div className="badge badge-primary">Admin</div>
            : <div className="badge badge-secondary">Owner</div>
    }

    const getStatusBadge = (status) => {
        return status === 'active'
            ? <div className="badge badge-success">Active</div>
            : <div className="badge badge-error">Disabled</div>
    }

    // Check if current user is admin
    if (user?.role !== 'admin') {
        return (
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">Access Denied</h1>
                        <p className="py-6">You don't have permission to access this page. Only admins can manage owners.</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <>
            <TitleCard title="Owner Management" topMargin="mt-2">
                <div className="overflow-x-auto w-full">
                    <table className="table w-full">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center">Loading...</td>
                                </tr>
                            ) : owners.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No owners found</td>
                                </tr>
                            ) : (
                                owners.map((owner) => {
                                    const isCurrentUser = owner.id === user?.id
                                    return(
                                        <tr key={owner.id}>
                                        <td>
                                            <div className="font-bold">{owner.name}</div>
                                            {isCurrentUser && <div className="text-xs text-gray-500">(You)</div>}
                                        </td>
                                        <td>{owner.email}</td>
                                        <td>{getRoleBadge(owner.role)}</td>
                                        <td>{getStatusBadge(owner.status)}</td>
                                        <td>{moment(owner.created_at).format("DD MMM YY")}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                {!isCurrentUser && owner.role !== 'admin' && (
                                                    <>
                                                        <button 
                                                            className={`btn btn-sm ${owner.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                                                            onClick={() => toggleOwnerStatus(owner)}
                                                        >
                                                            {owner.status === 'active' ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button 
                                                            className="btn btn-square btn-ghost btn-sm" 
                                                            onClick={() => deleteCurrentOwner(owner.id)}
                                                        >
                                                            <TrashIcon className="w-5"/>
                                                        </button>
                                                    </>
                                                )}
                                                {isCurrentUser && (
                                                    <span className="text-sm text-gray-500">Cannot modify yourself</span>
                                                )}
                                                {!isCurrentUser && owner.role === 'admin' && (
                                                    <span className="text-sm text-gray-500">Cannot modify admin</span>
                                                )}
                                            </div>
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

export default Owners
