import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { HouseholdMember, Ingredient, MealTemplate, Task } from '../lib/api'

const TYPE_OPTIONS = ['chore', 'meal', 'event', 'todo']
const RECURRENCE_OPTIONS = [
  { value: '', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

interface Props {
  householdId: string
  dayWindow: string | null
  weekStart: string | null
  members: HouseholdMember[]
  onCreated: (task: Task) => void
  onClose: () => void
}

const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const labelStyle: React.CSSProperties = { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }
const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 6, fontSize: 13,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)', color: 'inherit',
}
const selectStyle: React.CSSProperties = { ...inputStyle, background: '#1e1e2e' }

export default function CreateTaskModal({ householdId, dayWindow, weekStart, members, onCreated, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [taskType, setTaskType] = useState('chore')
  const [assignedTo, setAssignedTo] = useState('')
  const [recurrence, setRecurrence] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Meal library
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [mealSearch, setMealSearch] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (taskType === 'meal') {
      api.getMealTemplates(householdId).then(setTemplates)
    }
  }, [taskType])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(mealSearch.toLowerCase())
  )

  function selectTemplate(template: MealTemplate) {
    setTitle(template.name)
    setSelectedIngredients(template.ingredients)
    setMealSearch(template.name)
    setShowDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const task = await api.createTask(householdId, {
        title: title.trim(),
        task_type: taskType,
        assigned_to: assignedTo || undefined,
        recurrence: (recurrence || null) as Task['recurrence'],
        description: notes.trim() || undefined,
        day_window: dayWindow ?? undefined,
        week_start: weekStart ?? undefined,
        ingredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
      })
      onCreated(task)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.5)' }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
          width: 420,
          background: '#1e1e2e',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>New task</h3>
          <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 16 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>TYPE</span>
              <select value={taskType} onChange={(e) => { setTaskType(e.target.value); setSelectedIngredients([]); setMealSearch('') }} style={selectStyle}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>RECURRENCE</span>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} style={selectStyle}>
                {RECURRENCE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
          </div>

          {/* Meal library picker */}
          {taskType === 'meal' && templates.length > 0 && (
            <div style={{ ...fieldStyle, position: 'relative' }}>
              <span style={labelStyle}>MEAL LIBRARY</span>
              <input
                ref={searchRef}
                value={mealSearch}
                onChange={(e) => { setMealSearch(e.target.value); setShowDropdown(true); setSelectedIngredients([]) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search saved meals…"
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              />
              {showDropdown && filteredTemplates.length > 0 && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6, marginTop: 2, maxHeight: 180, overflowY: 'auto',
                  }}
                >
                  {filteredTemplates.map((t) => (
                    <div
                      key={t.id}
                      onMouseDown={() => selectTemplate(t)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>{t.name}</div>
                      {t.ingredients.length > 0 && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {t.ingredients.map((i) => i.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedIngredients.length > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} loaded
                </div>
              )}
            </div>
          )}

          <label style={fieldStyle}>
            <span style={labelStyle}>TITLE</span>
            <input
              required
              autoFocus={taskType !== 'meal'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>ASSIGN TO</span>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectStyle}>
              <option value="">— unassigned —</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ?? m.user_id.slice(0, 8) + '…'}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>NOTES</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </label>

          {dayWindow && (
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              Scheduled for <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{dayWindow}</strong> this week
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !title.trim()}
            style={{
              padding: '10px 16px', borderRadius: 8,
              background: '#3b82f6', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 600,
              cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !title.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? 'Creating…' : 'Create task'}
          </button>
        </form>
      </div>
    </>
  )
}
