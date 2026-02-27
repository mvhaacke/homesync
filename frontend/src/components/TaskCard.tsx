import { useState } from 'react'
import type { Task, HouseholdMember } from '../lib/api'

const STATE_COLORS: Record<string, string> = {
  proposed: '#3b82f6',
  accepted: '#22a95e',
  declined: '#ef4444',
  done: '#6b7280',
}

interface Props {
  task: Task
  members: HouseholdMember[]
  currentUserId: string
  isDragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onClick: (id: string) => void
  onStateChange: (id: string, state: string) => void
  onDone: (id: string) => void
}

export default function TaskCard({
  task, members, currentUserId, isDragging, onDragStart, onDragEnd, onClick, onStateChange, onDone,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const member = members.find((m) => m.user_id === task.assigned_to)
  const dotColor = member?.color ?? '#888'
  const isDone = task.state === 'done'
  const showAcceptDecline = task.state === 'proposed' && task.proposed_by !== currentUserId
  const showBadge = isDone || task.state === 'accepted' || task.state === 'declined'

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); onDragStart(task.id) }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 6,
        border: task.state === 'proposed'
          ? '1px solid rgba(59,130,246,0.4)'
          : '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        cursor: isDone ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : isDone ? 0.45 : 1,
        userSelect: 'none',
      }}
    >
      {/* Hover done button — absolute, doesn't affect layout */}
      {hovered && task.state === 'accepted' && (
        <button
          onClick={(e) => { e.stopPropagation(); onDone(task.id) }}
          title="Mark done"
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 20, height: 20, borderRadius: 4, padding: 0,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✓</button>
      )}

      {/* Title */}
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 6,
        wordBreak: 'break-word',
        paddingRight: hovered && !isDone ? 24 : 0,
        textDecoration: isDone ? 'line-through' : 'none',
        color: isDone ? 'rgba(255,255,255,0.5)' : 'inherit',
      }}>
        {task.title}
      </div>

      {/* Badge + icons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {showBadge && (
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 10,
            background: STATE_COLORS[task.state] ?? '#888',
            color: '#fff', fontWeight: 600, letterSpacing: 0.3,
          }}>
            {task.state}
          </span>
        )}
        {task.task_type === 'meal' && <span style={{ fontSize: 11 }} title="Meal">🍽</span>}
        {task.recurrence && !isDone && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }} title={`Repeats ${task.recurrence}`}>↻</span>
        )}
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: dotColor, flexShrink: 0, marginLeft: 'auto',
          }}
          title={member?.display_name ?? 'unassigned'}
        />
      </div>

      {/* Accept / decline row — only for proposed tasks not proposed by current user */}
      {showAcceptDecline && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onStateChange(task.id, 'accepted') }}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4,
              border: '1px solid rgba(34,169,94,0.5)',
              background: 'rgba(34,169,94,0.15)',
              color: '#22a95e', fontSize: 11, cursor: 'pointer',
            }}
          >✓ Accept</button>
          <button
            onClick={(e) => { e.stopPropagation(); onStateChange(task.id, 'declined') }}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444', fontSize: 11, cursor: 'pointer',
            }}
          >✕ Decline</button>
        </div>
      )}
    </div>
  )
}
