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

const getStabilityEmoji = (score) => {
  if (score === null) return '⚪'
  if (score >= 85) return '🟢'
  if (score >= 70) return '🟢'
  if (score >= 50) return '🟡'
  if (score >= 30) return '🟠'
  return '🔴'
}

function ConnectActivityChart() {

    const calculateStability = (memberContacts) => {
        if (!memberContacts || memberContacts.length === 0) {
            return {
                score: null,
                level: 'No Activity',
                totalConnections: 0,
                activeHours: 0,
                max10MinBurst: 0,
                max60MinBurst: 0
            }
        }

        // Sort all connections chronologically
        const times = memberContacts
            .map(contact => moment(contact.contacted_at))
            .sort((a, b) => a.valueOf() - b.valueOf())

        // -----------------------------
        // 1. Find maximum connections
        //    inside any 10-minute window
        // -----------------------------
        let max10MinBurst = 1

        for (let i = 0; i < times.length; i++) {
            let count = 1

            for (let j = i + 1; j < times.length; j++) {
            const minutes = times[j].diff(times[i], 'minutes', true)

            if (minutes > 10) break

            count++
            }

            max10MinBurst = Math.max(max10MinBurst, count)
        }

        // -----------------------------
        // 2. Find maximum connections
        //    inside any 60-minute window
        // -----------------------------
        let max60MinBurst = 1

        for (let i = 0; i < times.length; i++) {
            let count = 1

            for (let j = i + 1; j < times.length; j++) {
            const minutes = times[j].diff(times[i], 'minutes', true)

            if (minutes > 60) break

            count++
            }

            max60MinBurst = Math.max(max60MinBurst, count)
        }

        // -----------------------------
        // 3. Measure how concentrated
        //    the activity is by hour
        // -----------------------------
        const hourlyBuckets = new Array(24).fill(0)

        times.forEach(time => {
            const hour = time.hour()

            // Business day starts at 6 AM
            const businessHour = hour >= 6
            ? hour - 6
            : hour + 18

            hourlyBuckets[businessHour]++
        })

        const activeHours = hourlyBuckets.filter(count => count > 0).length
        const totalConnections = times.length
        const lowVolumeMultiplier =
          totalConnections <= 5
            ? 0.25
            : totalConnections <= 10
              ? 0.5
              : 1

        const maxHourlyConnections = Math.max(...hourlyBuckets)

        const busiestHourShare =
        totalConnections > 0
            ? maxHourlyConnections / totalConnections
            : 0

        // -----------------------------
        // Internal stability penalties
        // -----------------------------
        let score = 100

        // Daily connection volume penalty
        if (totalConnections > 100) {
        score -= 20
        } else if (totalConnections > 80) {
        score -= 12
        } else if (totalConnections > 60) {
        score -= 7
        } else if (totalConnections > 40) {
        score -= 3
        }

        // Penalize heavy concentration in a single hour
        if (busiestHourShare >= 0.5) {
          score -= 20 * lowVolumeMultiplier
        } else if (busiestHourShare >= 0.35) {
          score -= 12 * lowVolumeMultiplier
        } else if (busiestHourShare >= 0.25) {
          score -= 6 * lowVolumeMultiplier
        }

        score -= Math.max(0, max10MinBurst - 2) * 4 * lowVolumeMultiplier
        score -= Math.max(0, max60MinBurst - 10) * 1.5 * lowVolumeMultiplier

        // Concentrated activity penalty
        if (totalConnections >= 20) {
            if (activeHours <= 2) {
            score -= 25
            } else if (activeHours <= 4) {
            score -= 15
            } else if (activeHours <= 6) {
            score -= 8
            }
        }

        score = Math.max(0, Math.min(100, Math.round(score)))

        let level = 'Very Stable'

        if (score < 30) {
            level = 'Very High Risk'
        } else if (score < 50) {
            level = 'High Risk'
        } else if (score < 70) {
            level = 'Elevated'
        } else if (score < 85) {
            level = 'Stable'
        }

        return {
            score,
            level,
            totalConnections,
            activeHours,
            max10MinBurst,
            max60MinBurst,
            maxHourlyConnections,
            busiestHourShare
        }
    }
  const { stats } = useSelector(state => state.dashboard)

  const contacts = stats.connectionActivity || []
  const recruiters = stats.connectionRecruiters || []

  const stabilityByAccount = {}
  

    recruiters.forEach(recruiter => {
      const accountContacts = contacts.filter(
        contact => contact.recruiter_id === recruiter.id
      )

      stabilityByAccount[recruiter.id] = {
        recruiterId: recruiter.id,
        memberName: recruiter.name,
        accountName: recruiter.company || 'Unknown Account',
        ...calculateStability(accountContacts)
      }
  })

  const accountsNeedingAttention = Object.values(stabilityByAccount)
  .filter(account =>
    account.score !== null &&
    account.totalConnections >= 10 &&
    account.score < 70
  )
  .sort((a, b) => a.score - b.score)

  const stabilityByMember = {}

    MEMBER_ORDER.forEach(memberName => {
      const memberAccounts = Object.values(stabilityByAccount)
        .filter(account => account.memberName === memberName)

      const activeAccounts = memberAccounts
        .filter(account => account.score !== null)

      if (activeAccounts.length === 0) {
        stabilityByMember[memberName] = {
          score: null,
          level: 'No Activity',
          totalConnections: 0,
          activeAccounts: 0,
          weakestAccount: null
        }

        return
      }

      const totalConnections = activeAccounts.reduce(
        (sum, account) => sum + account.totalConnections,
        0
      )

      const weightedAverageScore =
        activeAccounts.reduce(
          (sum, account) =>
            sum + account.score * Math.max(account.totalConnections, 1),
          0
        ) /
        activeAccounts.reduce(
          (sum, account) => sum + Math.max(account.totalConnections, 1),
          0
        )

      const weakestAccount = activeAccounts.reduce(
        (weakest, account) =>
          account.score < weakest.score ? account : weakest
      )

      // Member score:
      // 75% overall account performance
      // 25% weakest active account
      const busiestAccount = activeAccounts.reduce(
        (busiest, account) =>
          account.totalConnections > busiest.totalConnections
            ? account
            : busiest
      )

      const memberScore = Math.round(
        weightedAverageScore * 0.6 +
        weakestAccount.score * 0.2 +
        busiestAccount.score * 0.2
      )

      let level = 'Very Stable'

      if (memberScore < 30) level = 'Very High Risk'
      else if (memberScore < 50) level = 'High Risk'
      else if (memberScore < 70) level = 'Elevated'
      else if (memberScore < 85) level = 'Stable'

      stabilityByMember[memberName] = {
        score: memberScore,
        level,
        totalConnections,
        activeAccounts: activeAccounts.length,
        weakestAccount
      }
    })

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
        recruiterId: contact.recruiter_id,
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

            const account = stabilityByAccount[point.recruiterId]

            if (!account) {
              return [
                `${point.memberName} — ${moment(point.contactedAt).format('HH:mm:ss')}`
              ]
            }

            return [
              `${point.memberName} — ${account.accountName}`,
              `Sent at: ${moment(point.contactedAt).format('HH:mm:ss')}`,

              account.score === null
                ? `Account Stability: N/A`
                : `Account Stability: ${account.score}/100 (${account.level})`,

              `Account connects: ${account.totalConnections}`,
              `Active hours: ${account.activeHours}`,
              `Max in 10 min: ${account.max10MinBurst}`,
              `Max in 60 min: ${account.max60MinBurst}`,
              `Busiest hour: ${account.maxHourlyConnections ?? 0}`,
              `Busiest hour share: ${Math.round(
                (account.busiestHourShare ?? 0) * 100
              )}%`
            ]
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
                    const memberName = MEMBER_ORDER[value]

                    if (!memberName) return ''

                    const stability = stabilityByMember[memberName]

                    if (!stability || stability.score === null) {
                        return `⚪ ${memberName} — N/A · No Activity · 0 connects`
                    }

                    const weakestAccountName =
                      stability.weakestAccount?.accountName || 'N/A'

                    const busiestAccountName =
                      stability.busiestAccount?.accountName || 'N/A'

                    return `${getStabilityEmoji(stability.score)} ${memberName} — ${stability.score}/100 · ${stability.level} · ${stability.totalConnections} connects · ${stability.activeAccounts} accounts · Busiest: ${busiestAccountName} · Weakest: ${weakestAccountName}`
                },
                padding: 10
            },

            grid: {
                drawTicks: false
            }
        }
    }
  }

  const validStabilities = MEMBER_ORDER
    .map(memberName => ({
        memberName,
        ...stabilityByMember[memberName]
    }))
    .filter(item => item.score !== null)

    const lowestStability = validStabilities.length
    ? validStabilities.reduce((lowest, current) =>
        current.score < lowest.score ? current : lowest
        )
    : null

  return (
    <TitleCard title="24 Hour LinkedIn Connect Activity">
        {lowestStability && (
            <div className="mb-4 text-sm">
                Lowest Stability:
                <span className="font-semibold ml-2">
                {getStabilityEmoji(lowestStability.score)}
                {' '}
                {lowestStability.memberName}
                {' — '}
                {lowestStability.score}/100
                {' · '}
                {lowestStability.level}
                </span>
            </div>
            )}
      <div className="h-96">
        <Scatter
          data={data}
          options={options}
        />
      </div>
      {accountsNeedingAttention.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-3">
            Accounts Needing Attention
          </div>

          <div className="space-y-2">
            {accountsNeedingAttention.map(account => (
              <div
                key={account.recruiterId}
                className="border rounded-lg p-3 text-sm"
              >
                <div className="font-semibold">
                  {getStabilityEmoji(account.score)} {account.memberName} — {account.accountName}
                </div>

                <div className="mt-1">
                  {account.score}/100 · {account.level}
                </div>

                <div className="text-xs opacity-70 mt-1">
                  {account.totalConnections} connects ·
                  Max 10 min: {account.max10MinBurst} ·
                  Max 60 min: {account.max60MinBurst}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6">
        <div className="font-semibold mb-3">
          LinkedIn Account Stability
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(stabilityByAccount)
            .filter(account => account.score !== null)
            .sort((a, b) => a.score - b.score)
            .map(account => (
              <div
                key={account.recruiterId}
                className="border rounded-lg p-3 text-sm"
              >
                <div className="font-semibold">
                  {getStabilityEmoji(account.score)} {account.memberName}
                </div>

                <div className="text-xs opacity-70 mt-1">
                  {account.accountName}
                </div>

                <div className="mt-2">
                  Stability: {account.score}/100 · {account.level}
                </div>

                <div>
                  Connects: {account.totalConnections}
                </div>

                <div>
                  Active hours: {account.activeHours}
                </div>

                <div>
                  Max 10 min: {account.max10MinBurst}
                </div>

                <div>
                  Max 60 min: {account.max60MinBurst}
                </div>
              </div>
            ))}
        </div>
      </div>
    </TitleCard>
  )
}

export default ConnectActivityChart