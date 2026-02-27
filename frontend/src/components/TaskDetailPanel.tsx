import { useState } from 'react'
import { api } from '../lib/api'
import type { Task, HouseholdMember } from '../lib/api'

interface Props {
  task: Task
  members: HouseholdMember[]
  onClose: () => void
  onTaskUpdated: (task: Task) => void
}

const STATE_OPTIONS = ['proposed', 'accepted', 'counter_proposed', 'declined']

export default function TaskDetailPanel({ task, members, onClose, onTaskUpdated }: Props) {
  const [title, setTitle] = useState(task.title)

  async function patch(fields: Partial<Task>) {
    const updated = await api.patchTask(task.id, fields)
    onTaskUpdated(updated)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
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
          <h3 style={{ margin: 0, fontSize: 16 }}>Task details</h3>
          <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 16 }}>✕</button>
        </div>

        {/* Title */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>TITLE</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title.trim() && title !== task.title) patch({ title: title.trim() }) }}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              color: 'inherit',
              fontSize: 14,
            }}
          />
        </label>

        {/* State */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>STATE</span>
          <select
            value={task.state}
            onChange={(e) => patch({ state: e.target.value })}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#1e1e2e',
              color: 'inherit',
              fontSize: 14,
            }}
          >
            {STATE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {/* Assigned to */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>ASSIGNED TO</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {task.assigned_to && (
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: members.find((m) => m.user_id === task.assigned_to)?.color ?? '#888',
                  flexShrink: 0,
                }}
              />
            )}
            <select
              value={task.assigned_to ?? ''}
              onChange={(e) => patch({ assigned_to: e.target.value || null })}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#1e1e2e',
                color: 'inherit',
                fontSize: 14,
              }}
            >
              <option value="">— unassigned —</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_id.slice(0, 8)}…
                </option>
              ))}
            </select>
          </div>
        </label>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 'auto' }}>
          ID: {task.id.slice(0, 8)}…
        </div>
      </div>
    </>
  )
}
