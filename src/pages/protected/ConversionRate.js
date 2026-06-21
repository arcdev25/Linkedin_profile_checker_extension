import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '../../features/common/headerSlice'
import ConversionRate from '../../features/conversionRate/index'

function ConversionRatePage() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title: "Conversion Rate" }))
    }, [])

    return <ConversionRate />
}

export default ConversionRatePage
