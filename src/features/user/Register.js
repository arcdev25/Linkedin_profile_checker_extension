import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'
import LandingIntro from './LandingIntro'
import ErrorText from  '../../components/Typography/ErrorText'
import InputText from '../../components/Input/InputText'
import { registerUser } from '../auth/authSlice'
import { showNotification } from '../common/headerSlice'

function Register(){

    const INITIAL_REGISTER_OBJ = {
        name : "",
        password : "",
        emailId : ""
    }

    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const submitForm = async (e) =>{
        e.preventDefault()
        setErrorMessage("")

        if(registerObj.name.trim() === "")return setErrorMessage("Name is required")
        if(registerObj.emailId.trim() === "")return setErrorMessage("Email is required")
        if(registerObj.password.trim() === "")return setErrorMessage("Password is required")
        if(registerObj.password.length < 6)return setErrorMessage("Password must be at least 6 characters")
        
        setLoading(true)
        try {
            await dispatch(registerUser({ 
                name: registerObj.name,
                email: registerObj.emailId, 
                password: registerObj.password 
            })).unwrap()
            
            dispatch(showNotification({message : "Registration successful! Please login.", status : 1}))
            navigate('/login')
        } catch (error) {
            setErrorMessage(error.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const updateFormValue = ({updateType, value}) => {
        setErrorMessage("")
        setRegisterObj({...registerObj, [updateType] : value})
    }

    return(
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="card mx-auto w-full max-w-5xl  shadow-xl">
                <div className="grid  md:grid-cols-2 grid-cols-1  bg-base-100 rounded-xl">
                <div className=''>
                        <LandingIntro />
                </div>
                <div className='py-24 px-10'>
                    <h2 className='text-2xl font-semibold mb-2 text-center'>Register</h2>
                    <form onSubmit={(e) => submitForm(e)}>

                        <div className="mb-4">

                            <InputText defaultValue={registerObj.name} updateType="name" containerStyle="mt-4" labelTitle="Name" updateFormValue={updateFormValue}/>

                            <InputText defaultValue={registerObj.emailId} updateType="emailId" containerStyle="mt-4" labelTitle="Email" updateFormValue={updateFormValue}/>

                            <InputText defaultValue={registerObj.password} type="password" updateType="password" containerStyle="mt-4" labelTitle="Password" updateFormValue={updateFormValue}/>

                        </div>

                        <ErrorText styleClass="mt-8">{errorMessage}</ErrorText>
                        <button type="submit" className={"btn mt-2 w-full btn-primary" + (loading ? " loading" : "")} disabled={loading}>Register</button>

                        <div className='text-center mt-4'>Already have an account? <Link to="/login"><span className="  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">Login</span></Link></div>
                    </form>
                </div>
            </div>
            </div>
        </div>
    )
}

export default Register