import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setPageTitle } from "../../features/common/headerSlice"
import Rank from "../../features/rank"

function RankPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Ranking" }))
    }, [])

    return <Rank />
}

export default RankPage