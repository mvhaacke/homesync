import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export default function JoinHousehold() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function redeem() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        localStorage.setItem('pendingInviteToken', token!)
        navigate('/signin')
        return
      }
      try {
        await api.redeemInvite(token!)
        navigate('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to redeem invite')
        setLoading(false)
      }
    }
    redeem()
  }, [token])

  if (loading && !error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#13131f' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Joining household…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#13131f' }}>
      <div
        style={{
          width: 400,
          background: '#1e1e2e',
          borderRadius: 12,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: '#ef4444' }}>Could not join</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{error}</p>
        <Link to="/" style={{ color: '#3b82f6', fontSize: 13 }}>Go to app →</Link>
      </div>
    </div>
  )
}
