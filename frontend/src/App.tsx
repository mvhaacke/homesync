import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import SignIn from './pages/SignIn'
import WeeklyGrid from './pages/WeeklyGrid'
import ProfileSetup from './pages/ProfileSetup'
import HouseholdSetup from './pages/HouseholdSetup'
import JoinHousehold from './pages/JoinHousehold'

type AppState = 'loading' | 'needs_profile' | 'needs_household' | 'ready'

function AppContent() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [appState, setAppState] = useState<AppState>('loading')
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const sessionRef = useRef<Session | null>(null)

  async function bootstrap(s: Session | null) {
    if (!s) return
    try {
      await api.getMyProfile()
    } catch {
      setAppState('needs_profile')
      return
    }
    const households = await api.getMyHouseholds()
    if (households.length === 0) {
      const pending = localStorage.getItem('pendingInviteToken')
      if (pending) {
        localStorage.removeItem('pendingInviteToken')
        setAppState('loading')
        navigate(`/join/${pending}`)
        return
      }
      setAppState('needs_household')
    } else {
      setHouseholdId(households[0].household_id)
      setAppState('ready')
    }
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      sessionRef.current = s
      setSession(s)
      if (s && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        bootstrap(s)
      } else if (!s) {
        setAppState('loading')
        setHouseholdId(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route
        path="/signin"
        element={session ? <Navigate to="/" replace /> : <SignIn />}
      />
      <Route path="/join/:token" element={<JoinHousehold />} />
      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/signin" replace />
          ) : appState === 'loading' ? (
            <p style={{ padding: 40 }}>Loading…</p>
          ) : appState === 'needs_profile' ? (
            <ProfileSetup onComplete={() => bootstrap(sessionRef.current)} />
          ) : appState === 'needs_household' ? (
            <HouseholdSetup onComplete={(id) => { setHouseholdId(id); setAppState('ready') }} />
          ) : (
            <WeeklyGrid householdId={householdId!} />
          )
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
