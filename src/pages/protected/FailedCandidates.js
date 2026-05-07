import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import FailedCandidates from '../../features/failedCandidates'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Failed Candidates"}))
    }, [])


    return(
        <FailedCandidates />
    )
}

export default InternalPage
