import type { Task, HouseholdMember } from '../lib/api'

const STATE_COLORS: Record<string, string> = {
  proposed: '#3b82f6',
  accepted: '#22a95e',
  declined: '#ef4444',
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
}

export default function TaskCard({
  task, members, currentUserId, isDragging, onDragStart, onDragEnd, onClick, onStateChange,
}: Props) {
  const member = members.find((m) => m.user_id === task.assigned_to)
  const badgeColor = STATE_COLORS[task.state] ?? '#888'
  const dotColor = member?.color ?? '#888'
  const showActions = task.state === 'proposed' && task.proposed_by !== currentUserId

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id)
        onDragStart(task.id)
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      style={{
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 6,
        border: task.state === 'proposed'
          ? '1px solid rgba(59,130,246,0.4)'
          : '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, wordBreak: 'break-word' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {task.state !== 'proposed' && (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              background: badgeColor,
              color: '#fff',
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            {task.state}
          </span>
        )}
        {task.task_type === 'meal' && (
          <span style={{ fontSize: 11 }} title="Meal">🍽</span>
        )}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginLeft: showActions ? 0 : 'auto',
          }}
          title={member ? (member.display_name ?? member.user_id) : 'unassigned'}
        />
        {showActions && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onStateChange(task.id, 'accepted') }}
              title="Accept"
              style={{
                width: 22, height: 22, borderRadius: 4, padding: 0,
                border: '1px solid rgba(34,169,94,0.5)',
                background: 'rgba(34,169,94,0.15)',
                color: '#22a95e', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✓</button>
            <button
              onClick={(e) => { e.stopPropagation(); onStateChange(task.id, 'declined') }}
              title="Decline"
              style={{
                width: 22, height: 22, borderRadius: 4, padding: 0,
                border: '1px solid rgba(239,68,68,0.5)',
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
