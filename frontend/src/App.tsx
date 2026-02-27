import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import SignIn from './pages/SignIn'
import WeeklyGrid from './pages/WeeklyGrid'
import ProfileSetup from './pages/ProfileSetup'
import HouseholdSetup from './pages/HouseholdSetup'

type AppState = 'loading' | 'needs_profile' | 'needs_household' | 'ready'

function App() {
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
      setAppState('needs_household')
    } else {
      setHouseholdId(households[0].household_id)
      setAppState('ready')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      sessionRef.current = s
      setSession(s)
      if (s) {
        bootstrap(s)
      } else {
        setAppState('loading')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s
      setSession(s)
      if (!s) {
        setAppState('loading')
        setHouseholdId(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={session ? <Navigate to="/" replace /> : <SignIn />}
        />
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
    </BrowserRouter>
  )
}

export default App
