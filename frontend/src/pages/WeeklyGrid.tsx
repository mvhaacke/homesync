import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Task, HouseholdMember } from '../lib/api'
import { currentWeekMonday, shiftWeek, weekDays } from '../lib/weekUtils'
import WeekNav from '../components/WeekNav'
import DayColumn from '../components/DayColumn'
import BacklogColumn from '../components/BacklogColumn'
import TaskDetailPanel from '../components/TaskDetailPanel'
import ShoppingListPanel from '../components/ShoppingListPanel'
import MembersPanel from '../components/MembersPanel'
import ProfilePanel from '../components/ProfilePanel'
import { supabase } from '../lib/supabase'

interface Props {
  householdId: string
}

export default function WeeklyGrid({ householdId }: Props) {
  const [weekMonday, setWeekMonday] = useState<string>(currentWeekMonday)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [showShopping, setShowShopping] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Initial data load
  useEffect(() => {
    Promise.all([
      api.listTasks(householdId),
      api.getHousehold(householdId),
      supabase.auth.getUser(),
    ]).then(([allTasks, hh, { data: { user } }]) => {
      setTasks(allTasks)
      setMembers(hh.members ?? [])
      setCurrentUserId(user?.id ?? '')
    }).finally(() => setLoading(false))
  }, [householdId])

  // Realtime subscriptions
  useEffect(() => {
    const taskChannel = supabase
      .channel(`tasks:${householdId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setTasks((prev) => prev.some((t) => t.id === (payload.new as Task).id)
            ? prev
            : [...prev, payload.new as Task])
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setTasks((prev) => prev.map((t) => t.id === (payload.new as Task).id ? payload.new as Task : t))
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id))
        })
      .subscribe()

    const memberChannel = supabase
      .channel(`members:${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${householdId}` },
        () => {
          api.getHousehold(householdId).then((hh) => setMembers(hh.members ?? []))
        })
      .subscribe()

    return () => {
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(memberChannel)
    }
  }, [householdId])

  const backlogTasks = tasks.filter((t) => t.day_window === null)
  const scheduledTasks = tasks.filter(
    (t) => t.day_window !== null && t.week_start === weekMonday,
  )

  const days = weekDays(weekMonday)
  const currentMember = members.find((m) => m.user_id === currentUserId)

  function handleDrop(taskId: string, dayWindow: string | null) {
    setDraggingTaskId(null)
    const original = tasks.find((t) => t.id === taskId)
    if (!original) return
    const patch = { day_window: dayWindow, week_start: dayWindow ? weekMonday : null }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
    api.patchTask(taskId, patch)
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t))))
      .catch(() => setTasks((prev) => prev.map((t) => (t.id === taskId ? original : t))))
  }

  function handleStateChange(taskId: string, state: string) {
    const original = tasks.find((t) => t.id === taskId)
    if (!original) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, state } : t)))
    api.patchTask(taskId, { state })
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t))))
      .catch(() => setTasks((prev) => prev.map((t) => (t.id === taskId ? original : t))))
  }

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setSelectedTaskId(null)
  }

  function handleProfileSaved(displayName: string, color: string) {
    setMembers((prev) => prev.map((m) =>
      m.user_id === currentUserId ? { ...m, display_name: displayName, color } : m
    ))
    setShowProfile(false)
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
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setShowShopping((s) => !s)}
            style={{ fontSize: 12, padding: '4px 10px' }}
            title="Shopping list"
          >
            🛒
          </button>
          {currentMember && (
            <button
              onClick={() => setShowProfile((s) => !s)}
              title="Edit profile"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: currentMember.color ?? '#888', flexShrink: 0,
              }} />
              {currentMember.display_name}
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            Sign out
          </button>
        </div>
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
          currentUserId={currentUserId}
          draggingTaskId={draggingTaskId}
          onDragStart={setDraggingTaskId}
          onDragEnd={() => setDraggingTaskId(null)}
          onDrop={(taskId) => handleDrop(taskId, null)}
          onTaskClick={setSelectedTaskId}
          onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
          onTaskStateChanged={handleStateChange}
        />

        {days.map((day) => (
          <DayColumn
            key={day.day}
            day={day}
            weekMonday={weekMonday}
            householdId={householdId}
            tasks={scheduledTasks.filter((t) => t.day_window === day.day)}
            members={members}
            currentUserId={currentUserId}
            draggingTaskId={draggingTaskId}
            onDragStart={setDraggingTaskId}
            onDragEnd={() => setDraggingTaskId(null)}
            onDrop={(taskId, dayWindow) => handleDrop(taskId, dayWindow)}
            onTaskClick={setSelectedTaskId}
            onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
            onTaskStateChanged={handleStateChange}
          />
        ))}

        <MembersPanel householdId={householdId} members={members} />
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
          onTaskDeleted={handleDeleteTask}
        />
      )}

      {showShopping && (
        <ShoppingListPanel
          householdId={householdId}
          weekStart={weekMonday}
          onClose={() => setShowShopping(false)}
        />
      )}

      {showProfile && currentMember && (
        <ProfilePanel
          member={currentMember}
          onSaved={handleProfileSaved}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}
