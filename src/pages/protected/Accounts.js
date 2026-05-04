import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import Accounts from '../../features/accounts'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Accounts"}))
      }, [])


    return(
        <Accounts />
    )
}

export default InternalPage