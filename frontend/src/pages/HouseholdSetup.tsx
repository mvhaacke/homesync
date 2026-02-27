import { useState } from 'react'
import { api } from '../lib/api'

interface Props {
  onComplete: (householdId: string) => void
}

type Tab = 'create' | 'join'

export default function HouseholdSetup({ onComplete }: Props) {
  const [tab, setTab] = useState<Tab>('create')
  const [name, setName] = useState('')
  const [joinId, setJoinId] = useState('')
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

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinId.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.joinHousehold(joinId.trim())
      onComplete(joinId.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: 'none',
    borderRadius: 6,
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  })

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
            Create a new household or join an existing one.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 4 }}>
          <button style={tabStyle(tab === 'create')} onClick={() => { setTab('create'); setError(null) }}>Create</button>
          <button style={tabStyle(tab === 'join')} onClick={() => { setTab('join'); setError(null) }}>Join</button>
        </div>

        {tab === 'create' && (
          createdId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Household created! Share this ID with housemates so they can join:
              </p>
              <code
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  fontSize: 12,
                  wordBreak: 'break-all',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {createdId}
              </code>
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
          )
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>HOUSEHOLD ID</span>
              <input
                required
                autoFocus
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Paste the household UUID here"
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'inherit',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
            </label>
            {error && <p style={{ margin: 0, color: '#ef4444', fontSize: 13 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !joinId.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !joinId.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !joinId.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Joining…' : 'Join household'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
