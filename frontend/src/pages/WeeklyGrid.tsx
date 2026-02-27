import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Task, HouseholdMember } from '../lib/api'
import { currentWeekMonday, shiftWeek, weekDays } from '../lib/weekUtils'
import WeekNav from '../components/WeekNav'
import DayColumn from '../components/DayColumn'
import BacklogColumn from '../components/BacklogColumn'
import TaskDetailPanel from '../components/TaskDetailPanel'
import { supabase } from '../lib/supabase'

interface Props {
  householdId: string
}

export default function WeeklyGrid({ householdId }: Props) {
  const [weekMonday, setWeekMonday] = useState<string>(currentWeekMonday)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.listTasks(householdId), api.getHousehold(householdId)])
      .then(([allTasks, hh]) => {
        setTasks(allTasks)
        setMembers(hh.members ?? [])
      })
      .finally(() => setLoading(false))
  }, [householdId])

  const backlogTasks = tasks.filter((t) => t.day_window === null)
  const scheduledTasks = tasks.filter(
    (t) => t.day_window !== null && t.week_start === weekMonday,
  )

  const days = weekDays(weekMonday)

  function handleDrop(taskId: string, dayWindow: string | null) {
    const original = tasks.find((t) => t.id === taskId)
    if (!original) return
    const patch = {
      day_window: dayWindow,
      week_start: dayWindow ? weekMonday : null,
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
    api
      .patchTask(taskId, patch)
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t))))
      .catch(() => setTasks((prev) => prev.map((t) => (t.id === taskId ? original : t))))
  }

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>HomeSync</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ fontSize: 12, padding: '4px 10px' }}
        >
          Sign out
        </button>
      </div>

      <WeekNav
        monday={weekMonday}
        onPrev={() => setWeekMonday((m) => shiftWeek(m, -1))}
        onNext={() => setWeekMonday((m) => shiftWeek(m, 1))}
      />

      {/* Grid area */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flex: 1,
          overflowX: 'auto',
          minHeight: 0,
        }}
      >
        <BacklogColumn
          householdId={householdId}
          tasks={backlogTasks}
          members={members}
          draggingTaskId={draggingTaskId}
          onDragStart={setDraggingTaskId}
          onDragEnd={() => setDraggingTaskId(null)}
          onDrop={(taskId) => handleDrop(taskId, null)}
          onTaskClick={setSelectedTaskId}
          onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
        />

        {days.map((day) => (
          <DayColumn
            key={day.day}
            day={day}
            weekMonday={weekMonday}
            householdId={householdId}
            tasks={scheduledTasks.filter((t) => t.day_window === day.day)}
            members={members}
            draggingTaskId={draggingTaskId}
            onDragStart={setDraggingTaskId}
            onDragEnd={() => setDraggingTaskId(null)}
            onDrop={(taskId, dayWindow) => handleDrop(taskId, dayWindow)}
            onTaskClick={setSelectedTaskId}
            onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }}
        />
      )}
    </div>
  )
}
