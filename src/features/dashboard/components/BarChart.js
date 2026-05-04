import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import TitleCard from '../../../components/Cards/TitleCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BarChart(){
    const { stats } = useSelector(state => state.dashboard)

    const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      };
      
      const labels = stats.dailyStats.map(day => {
        const date = new Date(day.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
      
      const data = {
        labels,
        datasets: [
          {
            label: 'Pending',
            data: stats.dailyStats.map(day => day.pending),
            backgroundColor: 'rgba(255, 206, 86, 0.8)',
          },
          {
            label: 'Success',
            data: stats.dailyStats.map(day => day.success),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
          },
        ],
      };

    return(
      <TitleCard title={"Daily Status Breakdown"}>
            <Bar options={options} data={data} />
      </TitleCard>

    )
}

export default BarChart