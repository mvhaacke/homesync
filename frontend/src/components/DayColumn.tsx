import { useRef, useState } from 'react'
import type { Task, HouseholdMember } from '../lib/api'
import type { DayMeta } from '../lib/weekUtils'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'

interface Props {
  day: DayMeta
  weekMonday: string
  householdId: string
  tasks: Task[]
  members: HouseholdMember[]
  currentUserId: string
  draggingTaskId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (taskId: string, day: string) => void
  onTaskClick: (id: string) => void
  onTaskCreated: (task: Task) => void
  onTaskStateChanged: (taskId: string, state: string) => void
}

export default function DayColumn({
  day,
  weekMonday,
  householdId,
  tasks,
  members,
  currentUserId,
  draggingTaskId,
  onDragStart,
  onDragEnd,
  onDrop,
  onTaskClick,
  onTaskCreated,
  onTaskStateChanged,
}: Props) {
  const [isOver, setIsOver] = useState(false)
  const counter = useRef(0)

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
      style={{
        flex: 1,
        minWidth: 120,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 6px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        background: isOver ? 'rgba(100,108,255,0.1)' : 'rgba(255,255,255,0.02)',
        transition: 'background 0.15s',
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
        {tasks.map((task) => (
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
          />
        ))}
      </div>
      <AddTaskForm
        householdId={householdId}
        dayWindow={day.day}
        weekStart={weekMonday}
        onCreated={onTaskCreated}
      />
    </div>
  )
}
