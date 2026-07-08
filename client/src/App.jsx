import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import NavBar from './NavBar'
import { Landing } from './pages/Marketing'
import { Login, Register } from './pages/Auth'
import Onboarding from './pages/Onboarding'
import { ClosetGrid, ClosetItemDetail, SnapTag } from './pages/Closet'
import { OccasionPicker, OccasionResults, OutfitDetail, Beauty, Nails } from './pages/Occasions'
import { InfluencerList, Feed, RecreateLook, Trending, Notifications } from './pages/Influencers'
import { GapAnalysis, BestPrice, LookComplete } from './pages/Gap'
import Chat from './pages/Chat'

function AppShell({ children }) {
  return (
    <>
      <NavBar />
      <div className="fg-shell-body">{children}</div>
    </>
  )
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="fg-p-muted center" style={{ marginTop: 80 }}>Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarded) return <Navigate to={`/onboarding/${user.onboardingStep}`} replace />
  return <AppShell>{children}</AppShell>
}

function OnboardingRoute() {
  const { user, loading } = useAuth()
  if (loading) return <p className="fg-p-muted center" style={{ marginTop: 80 }}>Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return <Onboarding />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="fg-p-muted center" style={{ marginTop: 80 }}>Loading...</p>
  if (user) return <Navigate to={user.onboarded ? '/closet' : `/onboarding/${user.onboardingStep}`} replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/onboarding/:step" element={<OnboardingRoute />} />

      <Route path="/closet" element={<Protected><ClosetGrid /></Protected>} />
      <Route path="/closet/new" element={<Protected><SnapTag /></Protected>} />
      <Route path="/closet/:id" element={<Protected><ClosetItemDetail /></Protected>} />

      <Route path="/occasions" element={<Protected><OccasionPicker /></Protected>} />
      <Route path="/occasions/:occasion" element={<Protected><OccasionResults /></Protected>} />
      <Route path="/occasions/:occasion/outfit" element={<Protected><OutfitDetail /></Protected>} />
      <Route path="/outfits/:id/beauty" element={<Protected><Beauty /></Protected>} />
      <Route path="/outfits/:id/nails" element={<Protected><Nails /></Protected>} />

      <Route path="/influencers" element={<Protected><InfluencerList /></Protected>} />
      <Route path="/feed" element={<Protected><Feed /></Protected>} />
      <Route path="/looks/:id/recreate" element={<Protected><RecreateLook /></Protected>} />
      <Route path="/trending" element={<Protected><Trending /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />

      <Route path="/gap" element={<Protected><GapAnalysis /></Protected>} />
      <Route path="/gap/:id/price" element={<Protected><BestPrice /></Protected>} />
      <Route path="/gap/complete" element={<Protected><LookComplete /></Protected>} />

      <Route path="/chat" element={<Protected><Chat /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
