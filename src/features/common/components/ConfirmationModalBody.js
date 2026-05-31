import {useDispatch} from 'react-redux'
import { CONFIRMATION_MODAL_CLOSE_TYPES } from '../../../utils/globalConstantUtil'
import { deleteAccountFromDb } from '../../accounts/accountSlice'
import { deleteCandidateFromDb, deleteReconnectionContact } from '../../candidates/candidatesSlice'
import { deleteFailedCandidateFromDb } from '../../failedCandidates/failedCandidatesSlice'
import { deleteOwner } from '../../owners/ownersSlice'
import { showNotification } from '../headerSlice'

function ConfirmationModalBody({ extraObject, closeModal}){

    const dispatch = useDispatch()

    const { message, type, id} = extraObject


    const proceedWithYes = async() => {
        if(type === CONFIRMATION_MODAL_CLOSE_TYPES.ACCOUNT_DELETE){
            try {
                await dispatch(deleteAccountFromDb(id)).unwrap()
                dispatch(showNotification({message : "Account Deleted!", status : 1}))
            } catch (error) {
                dispatch(showNotification({message : "Failed to delete account", status : 0}))
            }
        }
        else if(type === CONFIRMATION_MODAL_CLOSE_TYPES.CANDIDATE_DELETE){
            try {
                await dispatch(deleteCandidateFromDb(id)).unwrap()
                dispatch(showNotification({message : "Candidate Deleted!", status : 1}))
            } catch (error) {
                dispatch(showNotification({message : "Failed to delete candidate", status : 0}))
            }
        }
        else if(type === CONFIRMATION_MODAL_CLOSE_TYPES.RECONNECTION_CONTACT_DELETE){
            try {
                await dispatch(deleteReconnectionContact(id)).unwrap()
                dispatch(showNotification({message : "Removed from reconnection list!", status : 1}))
            } catch (error) {
                dispatch(showNotification({message : "Failed to remove contact", status : 0}))
            }
        }
        else if(type === CONFIRMATION_MODAL_CLOSE_TYPES.FAILED_CANDIDATE_DELETE){
            try {
                await dispatch(deleteFailedCandidateFromDb(id)).unwrap()
                dispatch(showNotification({message : "Failed Candidate Deleted!", status : 1}))
            } catch (error) {
                dispatch(showNotification({message : "Failed to delete candidate", status : 0}))
            }
        }
        else if(type === CONFIRMATION_MODAL_CLOSE_TYPES.OWNER_DELETE){
            try {
                await dispatch(deleteOwner(id)).unwrap()
                dispatch(showNotification({message : "Owner Deleted!", status : 1}))
            } catch (error) {
                dispatch(showNotification({message : "Failed to delete owner", status : 0}))
            }
        }
        closeModal()
    }

    return(
        <> 
        <p className=' text-xl mt-8 text-center'>
            {message}
        </p>

        <div className="modal-action mt-12">
                
                <button className="btn btn-outline   " onClick={() => closeModal()}>Cancel</button>

                <button className="btn btn-primary w-36" onClick={() => proceedWithYes()}>Yes</button> 

        </div>
        </>
    )
}

export default ConfirmationModalBody