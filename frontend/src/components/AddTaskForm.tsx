import { useState } from 'react'
import { api } from '../lib/api'
import type { Task } from '../lib/api'

interface Props {
  householdId: string
  dayWindow: string | null
  weekStart: string | null
  onCreated: (task: Task) => void
}

const TYPE_OPTIONS = ['chore', 'meal', 'event', 'todo']

export default function AddTaskForm({ householdId, dayWindow, weekStart, onCreated }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [taskType, setTaskType] = useState('chore')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const task = await api.createTask(householdId, {
        title: title.trim(),
        task_type: taskType,
        day_window: dayWindow ?? undefined,
        week_start: weekStart ?? undefined,
      })
      onCreated(task)
      setTitle('')
      setTaskType('chore')
      setExpanded(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          width: '100%',
          marginTop: 6,
          padding: '4px 8px',
          fontSize: 12,
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.2)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
        }}
      >
        + Add
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 6 }}>
      <select
        value={taskType}
        onChange={(e) => setTaskType(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontSize: 12,
          padding: '4px 6px',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.25)',
          background: '#1e1e2e',
          color: 'inherit',
          marginBottom: 4,
        }}
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setExpanded(false)}
        placeholder="Task title…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontSize: 13,
          padding: '4px 6px',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.08)',
          color: 'inherit',
          marginBottom: 4,
        }}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="submit" disabled={submitting} style={{ flex: 1, padding: '3px 0', fontSize: 12 }}>
          {submitting ? '…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{ padding: '3px 8px', fontSize: 12 }}
        >
          ✕
        </button>
      </div>
    </form>
  )
}
