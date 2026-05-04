import { useState } from "react"
import { useDispatch } from "react-redux"
import InputText from '../../../components/Input/InputText'
import TextAreaInput from '../../../components/Input/TextAreaInput'
import ErrorText from '../../../components/Typography/ErrorText'
import { showNotification } from "../../common/headerSlice"
import { addCandidateToDb } from "../candidatesSlice"

const INITIAL_CANDIDATE_OBJ = {
    linkedin_id: "",
    name: "",
    headline: "",
    profile_url: "",
    avatar_url: ""
}

function AddCandidateModalBody({closeModal}){
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [candidateObj, setCandidateObj] = useState(INITIAL_CANDIDATE_OBJ)

    const saveNewCandidate = async () => {
        if(candidateObj.name.trim() === "") return setErrorMessage("Name is required!")
        else if(candidateObj.linkedin_id.trim() === "") return setErrorMessage("LinkedIn ID is required!")
        else {
            setLoading(true)
            try {
                const newCandidateObj = {
                    linkedin_id: candidateObj.linkedin_id,
                    name: candidateObj.name,
                    headline: candidateObj.headline,
                    profile_url: candidateObj.profile_url,
                    avatar_url: candidateObj.avatar_url || "https://i.pravatar.cc/150?img=1"
                }
                await dispatch(addCandidateToDb(newCandidateObj)).unwrap()
                dispatch(showNotification({message : "New Candidate Added!", status : 1}))
                closeModal()
            } catch (error) {
                setErrorMessage(error.message || "Failed to add candidate")
            } finally {
                setLoading(false)
            }
        }
    }

    const updateFormValue = ({updateType, value}) => {
        setErrorMessage("")
        setCandidateObj({...candidateObj, [updateType] : value})
    }

    return(
        <>
            <InputText 
                type="text" 
                defaultValue={candidateObj.linkedin_id} 
                updateType="linkedin_id" 
                containerStyle="mt-4" 
                labelTitle="LinkedIn ID" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="text" 
                defaultValue={candidateObj.name} 
                updateType="name" 
                containerStyle="mt-4" 
                labelTitle="Full Name" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="text" 
                defaultValue={candidateObj.headline} 
                updateType="headline" 
                containerStyle="mt-4" 
                labelTitle="Headline" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="url" 
                defaultValue={candidateObj.profile_url} 
                updateType="profile_url" 
                containerStyle="mt-4" 
                labelTitle="LinkedIn Profile URL" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="url" 
                defaultValue={candidateObj.avatar_url} 
                updateType="avatar_url" 
                containerStyle="mt-4" 
                labelTitle="Avatar URL (optional)" 
                updateFormValue={updateFormValue}
            />

            <ErrorText styleClass="mt-16">{errorMessage}</ErrorText>
            <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => closeModal()} disabled={loading}>Cancel</button>
                <button className="btn btn-primary px-6" onClick={() => saveNewCandidate()} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </>
    )
}

export default AddCandidateModalBody
