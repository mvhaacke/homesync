import { useState } from 'react'
import { api } from '../lib/api'
import type { HouseholdMember } from '../lib/api'

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

interface Props {
  member: HouseholdMember
  onSaved: (displayName: string, color: string) => void
  onClose: () => void
}

export default function ProfilePanel({ member, onSaved, onClose }: Props) {
  const [displayName, setDisplayName] = useState(member.display_name ?? '')
  const [color, setColor] = useState(member.color ?? PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.upsertMyProfile(displayName.trim(), color)
      onSaved(displayName.trim(), color)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 320,
          zIndex: 100,
          background: '#1e1e2e',
          borderLeft: '1px solid rgba(255,255,255,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Edit profile</h3>
          <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 16 }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>DISPLAY NAME</span>
            <input
              required
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
                    width: 32, height: 32, borderRadius: '50%', background: c, padding: 0,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    outline: color === c ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    outlineOffset: 2,
                    cursor: 'pointer',
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
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </>
  )
}
