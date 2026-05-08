import {
  Chart as ChartJS,
  Filler,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import TitleCard from '../../../components/Cards/TitleCard';

ChartJS.register(ArcElement, Tooltip, Legend, Filler);

function DoughnutChart(){
    const { stats } = useSelector(state => state.dashboard)

    const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      };
      
      const labels = ['Pending', 'Chatting', 'Not Interested', 'Success', 'Failed', 'Ghosted', 'Sent JS'];
      
      const data = {
        labels,
        datasets: [
            {
                label: '# of Contacts',
                data: [
                    stats.statusCounts.pending || 0,
                    stats.statusCounts.chatting || 0,
                    stats.statusCounts['not interested'] || 0,
                    stats.statusCounts.success || 0,
                    stats.statusCounts.failed || 0,
                    stats.statusCounts.ghosted || 0,
                    stats.statusCounts['sent js'] || 0,
                ],
                backgroundColor: [
                  'rgba(255, 206, 86, 0.8)',
                  'rgba(54, 162, 235, 0.8)',
                  'rgba(255, 99, 132, 0.8)',
                  'rgba(75, 192, 192, 0.8)',
                  'rgba(255, 159, 64, 0.8)',
                  'rgba(153, 102, 255, 0.8)',
                  'rgba(100, 200, 150, 0.8)',
                ],
                borderColor: [
                  'rgba(255, 206, 86, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(255, 159, 64, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(100, 200, 150, 1)',
                ],
                borderWidth: 1,
              }
        ],
      };

    return(
        <TitleCard title={"Contact Status Distribution"}>
                <Doughnut options={options} data={data} />
        </TitleCard>
    )
}

export default DoughnutChart