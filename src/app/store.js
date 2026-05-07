import { configureStore } from '@reduxjs/toolkit'
import headerSlice from '../features/common/headerSlice'
import modalSlice from '../features/common/modalSlice'
import rightDrawerSlice from '../features/common/rightDrawerSlice'
import accountSlice from '../features/accounts/accountSlice'
import dashboardSlice from '../features/dashboard/dashboardSlice'
import candidatesSlice from '../features/candidates/candidatesSlice'
import authSlice from '../features/auth/authSlice'
import ownersSlice from '../features/owners/ownersSlice'
import failedCandidatesSlice from '../features/failedCandidates/failedCandidatesSlice'

const combinedReducer = {
  header : headerSlice,
  rightDrawer : rightDrawerSlice,
  modal : modalSlice,
  account : accountSlice,
  dashboard : dashboardSlice,
  candidates : candidatesSlice,
  auth : authSlice,
  owners : ownersSlice,
  failedCandidates : failedCandidatesSlice
}

export default configureStore({
    reducer: combinedReducer
})