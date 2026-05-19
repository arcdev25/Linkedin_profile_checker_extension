/** Icons are imported separatly to reduce build time */
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon'
import UsersIcon from '@heroicons/react/24/outline/UsersIcon'
import ShieldCheckIcon from '@heroicons/react/24/outline/ShieldCheckIcon'
import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon'
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/outline'

const iconClasses = `h-6 w-6`
const submenuIconClasses = `h-5 w-5`

const routes = [

  {
    path: '/app/dashboard',
    icon: <Squares2X2Icon className={iconClasses}/>, 
    name: 'Dashboard',
  },
  {
    path: '/app/accounts', // url
    icon: <UserGroupIcon className={iconClasses}/>, // icon component
    name: 'Accounts', // name that appear in Sidebar
  },
  {
    path: '/app/candidates', // url
    icon: <UsersIcon className={iconClasses}/>, // icon component
    name: 'Candidates', // name that appear in Sidebar
  },
  {
    path: '/app/failed-candidates', // url
    icon: <XCircleIcon className={iconClasses}/>, // icon component
    name: 'Failed Candidates', // name that appear in Sidebar
  },
  {
    path: '/app/owners',
    icon: <ShieldCheckIcon className={iconClasses}/>,
    name: 'Owners',
    adminOnly: true, // Only show for admin users
  },
  {
    path: '/app/daily-report',
    icon: <ClipboardDocumentListIcon className={iconClasses} />,
    name: 'Daily Report',
  },
  {
      path: '/app/rank',
      icon: <ChartBarIcon className={iconClasses} />,
      name: 'Ranking',
  }
]

export default routes


