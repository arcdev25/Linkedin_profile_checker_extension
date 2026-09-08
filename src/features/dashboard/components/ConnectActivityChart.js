import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { useSelector } from 'react-redux'
import TitleCard from '../../../components/Cards/TitleCard'
import moment from 'moment'

ChartJS.register(
  LinearScale,
  PointElement,
  Tooltip,
  Legend
)

const MEMBER_ORDER = [
  'Yura',
  'Faker',
  '0xGiant',
  'Rape',
  'Voldmot',
  'Myron D Porter'
]

function ConnectActivityChart() {
  const { stats } = useSelector(state => state.dashboard)

  const contacts = stats.connectionActivity || []
  const recruiters = stats.recruiterStats || []

  // recruiter_id -> member name
  const recruiterNameMap = {}

  recruiters.forEach(recruiter => {
    recruiterNameMap[recruiter.id] = recruiter.name
  })

  /*
    X axis:
    0  = 6 AM
    6  = 12 PM
    12 = 6 PM
    18 = 12 AM
    24 = next 6 AM

    Y axis:
    each member gets one horizontal row
  */
  const points = contacts
    .map(contact => {
      const memberName = recruiterNameMap[contact.recruiter_id]

      if (!memberName) return null

      const memberIndex = MEMBER_ORDER.indexOf(memberName)

      if (memberIndex === -1) return null

      const contactTime = moment(contact.contacted_at)

      const hour =
        contactTime.hours() +
        contactTime.minutes() / 60 +
        contactTime.seconds() / 3600

      // Convert normal clock time to 6 AM -> next 6 AM scale
      const businessHour = hour >= 6
        ? hour - 6
        : hour + 18

      return {
        x: businessHour,
        y: memberIndex,
        memberName,
        contactedAt: contact.contacted_at
      }
    })
    .filter(Boolean)

  const data = {
    datasets: [
      {
        label: 'LinkedIn Connections',
        data: points,

        // Small transparent dots.
        // When many connections happen close together,
        // overlapping dots naturally become darker.
        pointRadius: 5,
        pointHoverRadius: 7,
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false
      },

      tooltip: {
        callbacks: {
          title: () => '',
          label: (context) => {
            const point = context.raw

            return `${point.memberName} — ${moment(point.contactedAt).format('HH:mm:ss')}`
          }
        }
      }
    },

    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 24,

        title: {
          display: true,
          text: 'Time'
        },

        ticks: {
          stepSize: 3,

          callback: (value) => {
            const hour = (6 + value) % 24

            if (hour === 0) return '12 AM'
            if (hour === 12) return '12 PM'

            return hour > 12
              ? `${hour - 12} PM`
              : `${hour} AM`
          }
        }
      },

      y: {
            type: 'linear',
            min: -0.5,
            max: MEMBER_ORDER.length - 0.5,

            afterBuildTicks: (axis) => {
                axis.ticks = MEMBER_ORDER.map((_, index) => ({
                    value: index
                }))
            },

            ticks: {
                callback: (value) => {
                    return MEMBER_ORDER[value] ?? ''
                },
                padding: 10
            },

            grid: {
                drawTicks: false
            }
        }
    }
  }

  return (
    <TitleCard title="24 Hour LinkedIn Connect Activity">
      <div className="h-96">
        <Scatter
          data={data}
          options={options}
        />
      </div>
    </TitleCard>
  )
}

export default ConnectActivityChart