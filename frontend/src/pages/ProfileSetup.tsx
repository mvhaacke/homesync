import { useState } from 'react'
import { api } from '../lib/api'

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

interface Props {
  onComplete: () => void
}

export default function ProfileSetup({ onComplete }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.upsertMyProfile(displayName.trim(), color)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#13131f' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
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
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Set up your profile</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Choose a name and color for your calendar dot.
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>DISPLAY NAME</span>
          <input
            required
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>COLOR</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  outline: color === c ? '2px solid rgba(255,255,255,0.4)' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        {error && <p style={{ margin: 0, color: '#ef4444', fontSize: 13 }}>{error}</p>}

        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !displayName.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !displayName.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
