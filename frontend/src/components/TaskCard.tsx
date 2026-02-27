import type { Task, HouseholdMember } from '../lib/api'

const STATE_COLORS: Record<string, string> = {
  proposed: '#888',
  accepted: '#22a95e',
  counter_proposed: '#d97706',
  declined: '#ef4444',
}

interface Props {
  task: Task
  members: HouseholdMember[]
  isDragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onClick: (id: string) => void
}

export default function TaskCard({ task, members, isDragging, onDragStart, onDragEnd, onClick }: Props) {
  const member = members.find((m) => m.user_id === task.assigned_to)
  const badgeColor = STATE_COLORS[task.state] ?? '#888'
  const dotColor = member?.color ?? '#888'

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
        border: '1px solid rgba(255,255,255,0.12)',
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
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
          title={member ? member.user_id : 'unassigned'}
        />
      </div>
    </div>
  )
}
