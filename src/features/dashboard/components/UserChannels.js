import { useSelector } from "react-redux"
import TitleCard from "../../../components/Cards/TitleCard"

function UserChannels(){
    const { stats } = useSelector(state => state.dashboard)

    return(
        <TitleCard title={"Recruiter Performance"}>
             {/** Table Data */}
             <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr>
                        <th></th>
                        <th className="normal-case">Recruiter</th>
                        <th className="normal-case">Total Contacts</th>
                        <th className="normal-case">Success</th>
                        <th className="normal-case">Conversion</th>
                    </tr>
                    </thead>
                    <tbody>
                        {stats.recruiterStats.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">No recruiter data available</td>
                            </tr>
                        ) : (
                            stats.recruiterStats.map((recruiter, k) => {
                                return(
                                    <tr key={recruiter.id}>
                                        <th>{k+1}</th>
                                        <td>{recruiter.company || 'N/A'}</td>
                                        <td>{recruiter.totalContacts}</td>
                                        <td>{recruiter.successCount}</td>
                                        <td>{`${recruiter.conversionRate}%`}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </TitleCard>
    )
}

export default UserChannels
