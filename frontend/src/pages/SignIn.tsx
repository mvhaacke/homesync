import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SignIn() {
  const hasPendingInvite = !!localStorage.getItem('pendingInviteToken')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>(hasPendingInvite ? 'signup' : 'signin')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 16px' }}>
      <h1>HomeSync</h1>
      {hasPendingInvite && mode === 'signup' && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          Create an account to accept your invite.
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      {(hasPendingInvite || mode === 'signup') && (
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
          style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}
        >
          {mode === 'signin' ? 'Have an invite? Sign up' : 'Already have an account? Sign in'}
        </button>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
      {message && <p style={{ color: '#22c55e', fontSize: 13 }}>{message}</p>}
    </div>
  )
}
