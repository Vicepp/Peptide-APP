import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { ls } from './lib/store'
import Layout from './components/Layout'
import Onboarding from './pages/Onboarding'
import AuthPage from './pages/Auth'
import Setup from './pages/Setup'
import Home from './pages/Home'
import VerifyEmail from './pages/VerifyEmail'

const Library = lazy(() => import('./pages/Library'))
const PeptideDetail = lazy(() => import('./pages/PeptideDetail'))
const Calculator = lazy(() => import('./pages/Calculator'))
const Learn = lazy(() => import('./pages/Learn'))
const Article = lazy(() => import('./pages/Article'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Log = lazy(() => import('./pages/Log'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const Community = lazy(() => import('./pages/Community'))

export const Splash = () => <div className="splash"><div className="spinner" /></div>

function Private({ children }) {
  const { user, profile, loading, needsVerify } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to={ls.get('pw_onboarded', false) ? '/login' : '/welcome'} replace state={{ from: loc.pathname }} />
  if (needsVerify) return <VerifyEmail /> // email/password accounts must verify before entering
  if (profile && !profile.setupDone && loc.pathname !== '/setup') return <Navigate to="/setup" replace />
  return children
}

export default function App() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <Splash />
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/welcome" element={user ? <Navigate to="/" replace /> : <Onboarding />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
        <Route path="/setup" element={<Private><Setup /></Private>} />
        <Route element={<Private><Layout /></Private>}>
          <Route index element={<Home />} />
          <Route path="peptides" element={<Library />} />
          <Route path="peptides/:slug" element={<PeptideDetail />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="learn" element={<Learn />} />
          <Route path="learn/:id" element={<Article />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="log" element={<Log />} />
          <Route path="profile" element={<Profile />} />
          <Route path="community" element={<Community />} />
          <Route path="admin" element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
