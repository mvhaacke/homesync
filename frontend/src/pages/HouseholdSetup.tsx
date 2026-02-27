import { useState } from 'react'
import { api } from '../lib/api'

interface Props {
  onComplete: (householdId: string) => void
}

export default function HouseholdSetup({ onComplete }: Props) {
  const [name, setName] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const hh = await api.createHousehold(name.trim())
      setCreatedId(hh.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household')
    } finally {
      setLoading(false)
    }
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
          gap: 24,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Set up your household</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Create a new household. Invite housemates from inside the app.
          </p>
        </div>

        {createdId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Household created! You can invite housemates from the Members panel.
            </p>
            <button
              onClick={() => onComplete(createdId)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to my household →
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>HOUSEHOLD NAME</span>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Home"
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'inherit',
                  fontSize: 14,
                }}
              />
            </label>
            {error && <p style={{ margin: 0, color: '#ef4444', fontSize: 13 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating…' : 'Create household'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
