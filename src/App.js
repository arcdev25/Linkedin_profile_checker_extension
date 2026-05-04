import { lazy, useEffect, useState } from 'react'
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { themeChange } from 'theme-change'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './features/auth/authSlice'
import initializeApp from './app/init';

// Importing pages
const Layout = lazy(() => import('./containers/Layout'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Register = lazy(() => import('./pages/Register'))


// Initializing different libraries
initializeApp()


function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(state => state.auth)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    themeChange(false)
    
    // Check if user is authenticated on app load
    const checkUserAuth = async () => {
      try {
        await dispatch(checkAuth()).unwrap()
      } catch (error) {
        // User not authenticated, that's okay
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkUserAuth()
  }, [dispatch])

  // Show loading only on initial check
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/app/*" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to={isAuthenticated ? "/app/dashboard" : "/login"} replace />}/>

        </Routes>
      </Router>
    </>
  )
}

export default App
