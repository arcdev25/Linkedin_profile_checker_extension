// All components mapping with path for internal routes

import { lazy } from 'react'

const Dashboard = lazy(() => import('../pages/protected/Dashboard'))
const Welcome = lazy(() => import('../pages/protected/Welcome'))
const Page404 = lazy(() => import('../pages/protected/404'))
const Blank = lazy(() => import('../pages/protected/Blank'))
const Team = lazy(() => import('../pages/protected/Team'))
const Candidates = lazy(() => import('../pages/protected/Candidates'))
const FailedCandidates = lazy(() => import('../pages/protected/FailedCandidates'))
const Bills = lazy(() => import('../pages/protected/Bills'))
const ProfileSettings = lazy(() => import('../pages/protected/ProfileSettings'))
const Accounts = lazy(() => import('../pages/protected/Accounts'))
const Owners = lazy(() => import('../pages/protected/Owners'))
const DailyReport = lazy(() => import('../pages/protected/DailyReport'))
const Rank = lazy(() => import('../pages/protected/Rank'))

const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
  },
  {
    path: '/welcome',
    component: Welcome,
  },
  {
    path: '/accounts',
    component: Accounts,
  },
  {
    path: '/owners',
    component: Owners,
  },
  {
    path: '/settings-team',
    component: Team,
  },
  {
    path: '/candidates',
    component: Candidates,
  },
  {
    path: '/failed-candidates',
    component: FailedCandidates,
  },
  {
    path: '/settings-profile',
    component: ProfileSettings,
  },
  {
    path: '/settings-billing',
    component: Bills,
  },
  {
    path: '/404',
    component: Page404,
  },
  {
    path: '/blank',
    component: Blank,
  },
  {
    path: '/daily-report',
    component: DailyReport,
  },
  {
    path: '/rank',
    component: Rank
}
]

export default routes
