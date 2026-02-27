import { useState } from 'react'
import type { HouseholdMember, Task } from '../lib/api'
import CreateTaskModal from './CreateTaskModal'

interface Props {
  householdId: string
  dayWindow: string | null
  weekStart: string | null
  members: HouseholdMember[]
  onCreated: (task: Task) => void
}

export default function AddTaskForm({ householdId, dayWindow, weekStart, members, onCreated }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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

      {open && (
        <CreateTaskModal
          householdId={householdId}
          dayWindow={dayWindow}
          weekStart={weekStart}
          members={members}
          onCreated={onCreated}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
