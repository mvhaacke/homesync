import { useRef, useState } from 'react'
import type { Task, HouseholdMember } from '../lib/api'
import type { DayMeta } from '../lib/weekUtils'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'

interface Props {
  day: DayMeta
  weekMonday: string
  householdId: string
  tasks: Task[]
  members: HouseholdMember[]
  currentUserId: string
  draggingTaskId: string | null
  mobile?: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (taskId: string, day: string) => void
  onTaskClick: (id: string) => void
  onTaskCreated: (task: Task) => void
  onTaskStateChanged: (taskId: string, state: string) => void
  onTaskDone: (taskId: string) => void
}

export default function DayColumn({
  day,
  weekMonday,
  householdId,
  tasks,
  members,
  currentUserId,
  draggingTaskId,
  mobile,
  onDragStart,
  onDragEnd,
  onDrop,
  onTaskClick,
  onTaskCreated,
  onTaskStateChanged,
  onTaskDone,
}: Props) {
  const [isOver, setIsOver] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const counter = useRef(0)

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.start_time && !b.start_time) return 0
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <div
      onDragEnter={() => { counter.current++; setIsOver(true) }}
      onDragLeave={() => { if (--counter.current === 0) setIsOver(false) }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        counter.current = 0
        setIsOver(false)
        onDrop(e.dataTransfer.getData('taskId'), day.day)
      }}
      onClick={() => setShowCreate(true)}
      style={{
        flex: mobile ? undefined : 1,
        width: mobile ? '100%' : undefined,
        minWidth: mobile ? undefined : 120,
        minHeight: mobile ? 'calc(100dvh - 180px)' : undefined,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 6px',
        borderRadius: mobile ? 0 : 8,
        border: mobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
        background: isOver ? 'rgba(100,108,255,0.1)' : 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 8,
          letterSpacing: 0.5,
        }}
      >
        {day.label.toUpperCase()}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            currentUserId={currentUserId}
            isDragging={task.id === draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onTaskClick}
            onStateChange={onTaskStateChanged}
            onDone={onTaskDone}
          />
        ))}
      </div>
      {showCreate && (
        <CreateTaskModal
          householdId={householdId}
          dayWindow={day.day}
          weekStart={weekMonday}
          members={members}
          onCreated={onTaskCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
