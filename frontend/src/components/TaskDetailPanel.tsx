import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Ingredient, Task, HouseholdMember } from '../lib/api'
import IngredientEditor from './IngredientEditor'
import { currentWeekMonday } from '../lib/weekUtils'

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

interface Props {
  task: Task
  members: HouseholdMember[]
  currentUserId: string
  isMobile?: boolean
  onClose: () => void
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
}

const STATE_COLORS: Record<string, string> = {
  proposed: '#3b82f6',
  accepted: '#22a95e',
  declined: '#ef4444',
}

const TYPE_OPTIONS = ['chore', 'meal', 'event', 'todo']

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: 0.5,
}

const controlStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  fontSize: 14,
}

const selectStyle: React.CSSProperties = {
  ...controlStyle,
  background: '#1e1e2e',
}

export default function TaskDetailPanel({ task, members, currentUserId, isMobile, onClose, onTaskUpdated, onTaskDeleted }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(task.ingredients ?? [])
  const [deleting, setDeleting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setIngredients(task.ingredients ?? [])
  }, [task.id])

  const isProposer = task.proposed_by === currentUserId
  const isRecurringFuture = !!(
    task.recurrence_series_id &&
    task.week_start &&
    task.week_start >= currentWeekMonday()
  )

  async function patch(fields: Partial<Task>) {
    if (isRecurringFuture && task.recurrence_series_id && task.week_start) {
      await api.patchSeriesFromDate(task.recurrence_series_id, task.week_start, fields)
      onTaskUpdated({ ...task, ...fields })
    } else {
      const updated = await api.patchTask(task.id, fields)
      onTaskUpdated(updated)
    }
  }

  function handleDescriptionChange(value: string) {
    setDescription(value)
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current)
    descDebounceRef.current = setTimeout(() => {
      patch({ description: value || null })
    }, 600)
  }

  function handleIngredientsChange(next: Ingredient[]) {
    setIngredients(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const toSave = next.filter((ing) => ing.name.trim() !== '')
      patch({ ingredients: toSave })
      if (task.task_type === 'meal' && toSave.length > 0) {
        api.upsertMealTemplate(task.household_id, task.title, toSave)
      }
    }, 600)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      if (isRecurringFuture && task.recurrence_series_id && task.week_start) {
        await api.deleteSeriesFromDate(task.recurrence_series_id, task.week_start)
      } else {
        await api.deleteTask(task.id)
      }
      onTaskDeleted(task.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />

      <div
        style={isMobile ? {
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 100,
          background: '#1e1e2e',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '82vh',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        } : {
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
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
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Task details</h3>
          <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 16 }}>✕</button>
        </div>

        {isRecurringFuture && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px' }}>
            ↻ Recurring — edits apply to this and all future instances
          </div>
        )}

        {/* State badge — chores only */}
        {task.task_type === 'chore' && (
          <div style={fieldStyle}>
            <span style={labelStyle}>STATE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 10,
                  background: STATE_COLORS[task.state] ?? '#888',
                  color: '#fff',
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {task.state}
              </span>
              {task.state === 'declined' && isProposer && (
                <button
                  onClick={() => patch({ state: 'proposed' })}
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(59,130,246,0.4)',
                    background: 'rgba(59,130,246,0.15)',
                    color: '#93c5fd',
                    cursor: 'pointer',
                  }}
                >
                  Re-propose
                </button>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <label style={fieldStyle}>
          <span style={labelStyle}>TITLE</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== task.title) {
                const fields: Partial<Task> = { title: title.trim() }
                if (task.state === 'declined') fields.state = 'proposed'
                patch(fields)
              }
            }}
            style={controlStyle}
          />
        </label>

        {/* Notes */}
        <label style={fieldStyle}>
          <span style={labelStyle}>NOTES</span>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add notes…"
            rows={3}
            style={{
              ...controlStyle,
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </label>

        {/* Type */}
        <label style={fieldStyle}>
          <span style={labelStyle}>TYPE</span>
          <select
            value={task.task_type}
            onChange={(e) => patch({ task_type: e.target.value })}
            style={selectStyle}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {/* Start / end time */}
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ ...fieldStyle, flex: 1 }}>
            <span style={labelStyle}>START</span>
            <select
              value={task.start_time?.slice(0, 5) ?? ''}
              onChange={(e) => patch({ start_time: e.target.value || null })}
              style={selectStyle}
            >
              <option value="">—</option>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label style={{ ...fieldStyle, flex: 1 }}>
            <span style={labelStyle}>END</span>
            <select
              value={task.end_time?.slice(0, 5) ?? ''}
              onChange={(e) => patch({ end_time: e.target.value || null })}
              style={selectStyle}
            >
              <option value="">—</option>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        {/* Recurrence — not available for meals */}
        {task.task_type !== 'meal' && (
          <label style={fieldStyle}>
            <span style={labelStyle}>RECURRENCE</span>
            <select
              value={task.recurrence ?? ''}
              onChange={(e) => patch({ recurrence: (e.target.value || null) as Task['recurrence'] })}
              style={selectStyle}
            >
              <option value="">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        )}

        {/* Assigned to */}
        <label style={fieldStyle}>
          <span style={labelStyle}>ASSIGNED TO</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {task.assigned_to && (
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: members.find((m) => m.user_id === task.assigned_to)?.color ?? '#888',
                }}
              />
            )}
            <select
              value={task.assigned_to ?? ''}
              onChange={(e) => patch({ assigned_to: e.target.value || null })}
              style={{ ...selectStyle, flex: 1 }}
            >
              <option value="">— unassigned —</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ?? m.user_id.slice(0, 8) + '…'}
                </option>
              ))}
            </select>
          </div>
        </label>

        {/* Ingredient editor — meal tasks only */}
        {task.task_type === 'meal' && (
          <div style={fieldStyle}>
            <span style={labelStyle}>INGREDIENTS</span>
            <IngredientEditor ingredients={ingredients} onChange={handleIngredientsChange} />
          </div>
        )}

        {/* Footer: delete */}
        {isProposer && (
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Deleting…' : isRecurringFuture ? 'Delete this + future' : 'Delete task'}
            </button>
          </div>
        )}

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          ID: {task.id.slice(0, 8)}…
        </div>
      </div>
    </>
  )
}
