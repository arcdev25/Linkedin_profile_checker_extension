import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import TitleCard from '../../../components/Cards/TitleCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

function LineChart() {
  const { stats } = useSelector(state => state.dashboard)

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
    },
  };

  const labels = stats.dailyStats.map(day => {
    const date = new Date(day.date)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Total Contacts',
        data: stats.dailyStats.map(day => day.total),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        fill: true,
        label: 'Success',
        data: stats.dailyStats.map(day => day.success),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        fill: true,
        label: 'Chatting',
        data: stats.dailyStats.map(day => day.chatting),
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
    ],
  };

  return (
    <TitleCard title={"Last 7 Days Activity"}>
      <Line data={data} options={options} />
    </TitleCard>
  )
}

export default LineChart