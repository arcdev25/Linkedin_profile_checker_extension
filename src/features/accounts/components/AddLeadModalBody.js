import { useState } from "react"
import { useDispatch } from "react-redux"
import InputText from '../../../components/Input/InputText'
import ErrorText from '../../../components/Typography/ErrorText'
import { showNotification } from "../../common/headerSlice"
import { addAccountToDb, updateAccountInDb } from "../accountSlice"

const INITIAL_ACCOUNT_OBJ = {
    name: "",
    email: "",
    company: "",
    owner_name: ""
}

function AddAccountModalBody({closeModal, extraObject}){
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [accountObj, setAccountObj] = useState(extraObject || INITIAL_ACCOUNT_OBJ)
    const isEditMode = !!extraObject?.id

    const saveAccount = async () => {
        if(accountObj.name.trim() === "") return setErrorMessage("Name is required!")
        else {
            setLoading(true)
            try {
                if (isEditMode) {
                    // Update existing recruiter
                    const updates = {
                        name: accountObj.name,
                        email: accountObj.email,
                        company: accountObj.company,
                        owner_name: accountObj.owner_name
                    }
                    await dispatch(updateAccountInDb({ id: accountObj.id, updates })).unwrap()
                    dispatch(showNotification({message : "Recruiter Updated!", status : 1}))
                } else {
                    // Add new recruiter
                    const newAccountObj = {
                        name: accountObj.name,
                        email: accountObj.email,
                        company: accountObj.company,
                        owner_name: accountObj.owner_name
                    }
                    await dispatch(addAccountToDb(newAccountObj)).unwrap()
                    dispatch(showNotification({message : "New Recruiter Added!", status : 1}))
                }
                closeModal()
            } catch (error) {
                setErrorMessage(error.message || `Failed to ${isEditMode ? 'update' : 'add'} recruiter`)
            } finally {
                setLoading(false)
            }
        }
    }

    const updateFormValue = ({updateType, value}) => {
        setErrorMessage("")
        setAccountObj({...accountObj, [updateType] : value})
    }

    return(
        <>
            <InputText 
                type="text" 
                defaultValue={accountObj.name} 
                updateType="name" 
                containerStyle="mt-4" 
                labelTitle="Name" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="email" 
                defaultValue={accountObj.email} 
                updateType="email" 
                containerStyle="mt-4" 
                labelTitle="Email" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="text" 
                defaultValue={accountObj.company} 
                updateType="company" 
                containerStyle="mt-4" 
                labelTitle="Company" 
                updateFormValue={updateFormValue}
            />

            <InputText 
                type="text" 
                defaultValue={accountObj.owner_name} 
                updateType="owner_name" 
                containerStyle="mt-4" 
                labelTitle="Owner Name" 
                updateFormValue={updateFormValue}
            />

            <ErrorText styleClass="mt-16">{errorMessage}</ErrorText>
            <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => closeModal()} disabled={loading}>Cancel</button>
                <button className="btn btn-primary px-6" onClick={() => saveAccount()} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </>
    )
}

export default AddAccountModalBody