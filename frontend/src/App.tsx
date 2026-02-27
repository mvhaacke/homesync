import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import SignIn from './pages/SignIn'
import WeeklyGrid from './pages/WeeklyGrid'

// Placeholder — replace with real household selection in Phase 2
const DEMO_HOUSEHOLD_ID = import.meta.env.VITE_DEMO_HOUSEHOLD_ID as string | undefined

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>

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
            ) : DEMO_HOUSEHOLD_ID ? (
              <WeeklyGrid householdId={DEMO_HOUSEHOLD_ID} />
            ) : (
              <div style={{ padding: 40 }}>
                <p>Signed in as {session.user.email}</p>
                <p>
                  Set <code>VITE_DEMO_HOUSEHOLD_ID</code> in your .env to see tasks.
                </p>
                <button onClick={() => supabase.auth.signOut()}>Sign out</button>
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
