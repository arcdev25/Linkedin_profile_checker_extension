import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import InputText from '../../../components/Input/InputText'
import ErrorText from '../../../components/Typography/ErrorText'
import SelectBox from "../../../components/Input/SelectBox"
import { showNotification } from '../../common/headerSlice'
import { updateContactStatus, getCandidatesContent, getNeedReconnectionCandidates } from "../candidatesSlice"
import { getAccountsContent } from "../../accounts/accountSlice"

const INITIAL_CANDIDATE_OBJ = {
    recruiterId: "",
    status: "pending"
}

function ReconnectCandidateModalBody({closeModal, extraObject}){
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [candidateObj, setCandidateObj] = useState(INITIAL_CANDIDATE_OBJ)
    const { accounts } = useSelector(state => state.account)

    const { candidate } = extraObject

    useEffect(() => {
        dispatch(getAccountsContent())
    }, [dispatch])

    const statusOptions = [
        { name: "Pending", value: "pending" },
        { name: "Chatting", value: "chatting" },
        { name: "Send_js", value: "send_js" },
        { name: "Not_interested", value: "not_interested" },
        { name: "Success", value: "success" },
        { name: "Ghosted", value: "ghosted" }
    ]

    const recruiterOptions = accounts.map(acc => ({
        name: acc.name,
        value: acc.id
    }))

    const updateFormValue = ({updateType, value}) => {
        setErrorMessage("")
        setCandidateObj({...candidateObj, [updateType] : value})
    }

    const saveReconnection = async () => {
        if(candidateObj.recruiterId.trim() === ""){
            return setErrorMessage("Recruiter is required!")
        }

        setLoading(true)
        
        try {
            await dispatch(updateContactStatus({
                contactId: candidate.contactId,
                newStatus: candidateObj.status,
                recruiterId: candidateObj.recruiterId
            })).unwrap()

            dispatch(showNotification({message : "Candidate reconnected successfully!", status : 1}))
            
            // Refresh both lists
            dispatch(getCandidatesContent())
            dispatch(getNeedReconnectionCandidates())
            
            closeModal()
        } catch (error) {
            setErrorMessage(error.message || "Failed to reconnect candidate")
        } finally {
            setLoading(false)
        }
    }

    return(
        <>
            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    Reconnecting: <strong>{candidate.name}</strong>
                </p>
            </div>

            <SelectBox 
                labelTitle="Select Recruiter"
                placeholder="Choose a recruiter"
                containerStyle="mt-4"
                options={recruiterOptions}
                updateType="recruiterId"
                updateFormValue={updateFormValue}
            />

            <SelectBox 
                labelTitle="Status"
                placeholder="Choose status"
                containerStyle="mt-4"
                defaultValue={candidateObj.status}
                options={statusOptions}
                updateType="status"
                updateFormValue={updateFormValue}
            />

            <ErrorText styleClass="mt-4">{errorMessage}</ErrorText>
            <div className="modal-action">
                <button  className="btn btn-ghost" onClick={() => closeModal()}>Cancel</button>
                <button  className="btn btn-primary px-6" onClick={() => saveReconnection()}>
                    {loading ? "Reconnecting..." : "Reconnect"}
                </button>
            </div>
        </>
    )
}

export default ReconnectCandidateModalBody
