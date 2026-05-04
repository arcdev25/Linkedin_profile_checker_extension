import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import Owners from '../../features/owners'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Owner Management"}))
    }, [dispatch])

    return(
        <Owners />
    )
}

export default InternalPage
