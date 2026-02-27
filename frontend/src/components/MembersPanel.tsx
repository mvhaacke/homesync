import { useState } from 'react'
import { api } from '../lib/api'
import type { HouseholdInvite, HouseholdMember } from '../lib/api'

interface Props {
  householdId: string
  members: HouseholdMember[]
}

export default function MembersPanel({ householdId, members }: Props) {
  const [invite, setInvite] = useState<HouseholdInvite | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const result = await api.createInvite(householdId)
      setInvite(result)
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!invite) return
    const link = `${window.location.origin}/join/${invite.token}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inviteLink = invite ? `${window.location.origin}/join/${invite.token}` : null

  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: '#1e1e2e',
        borderLeft: '1px solid rgba(255,255,255,0.12)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
        Members
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m) => (
          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: m.color ?? '#6b7280',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.display_name ?? 'Unknown'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(59,130,246,0.2)',
            border: '1px solid rgba(59,130,246,0.4)',
            color: '#93c5fd',
            fontSize: 12,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? 'Generating…' : 'Generate invite link'}
        </button>

        {inviteLink && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                wordBreak: 'break-all',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
                padding: '6px 8px',
                fontFamily: 'monospace',
              }}
            >
              {inviteLink}
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
                color: copied ? '#86efac' : 'rgba(255,255,255,0.7)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Expires in 7 days</div>
          </div>
        )}
      </div>
    </div>
  )
}
