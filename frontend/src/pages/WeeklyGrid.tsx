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
import BottomSheet from '../components/BottomSheet'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabase'

function getTodayDayIndex(): number {
  const day = new Date().getDay() // 0=Sun..6=Sat
  return day === 0 ? 6 : day - 1  // Mon=0..Sun=6
}

interface Props {
  householdId: string
}

export default function WeeklyGrid({ householdId }: Props) {
  const isMobile = useIsMobile()
  const [weekMonday, setWeekMonday] = useState<string>(currentWeekMonday)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [showShopping, setShowShopping] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [mobileDayIndex, setMobileDayIndex] = useState(getTodayDayIndex)
  const [showBacklogSheet, setShowBacklogSheet] = useState(false)
  const [showMembersSheet, setShowMembersSheet] = useState(false)

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

  async function handleDone(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, state: 'done' } : t)))
    try {
      await api.patchTask(taskId, { state: 'done' })
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)))
    }
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

  function handlePrevDay() {
    if (mobileDayIndex > 0) {
      setMobileDayIndex((i) => i - 1)
    } else {
      setWeekMonday((m) => shiftWeek(m, -1))
      setMobileDayIndex(6)
    }
  }

  function handleNextDay() {
    if (mobileDayIndex < 6) {
      setMobileDayIndex((i) => i + 1)
    } else {
      setWeekMonday((m) => shiftWeek(m, 1))
      setMobileDayIndex(0)
    }
  }

  // Shared panels rendered on both layouts
  const sharedPanels = (
    <>
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          currentUserId={currentUserId}
          isMobile={isMobile}
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
    </>
  )

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>

  // ── Mobile layout ──────────────────────────────────────────────
  if (isMobile) {
    const today = days[mobileDayIndex]
    const todayTasks = scheduledTasks.filter((t) => t.day_window === today.day)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>HomeSync</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {currentMember && (
              <button
                onClick={() => setShowProfile((s) => !s)}
                title="Edit profile"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px' }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: currentMember.color ?? '#888', flexShrink: 0 }} />
                {currentMember.display_name}
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, padding: '4px 10px' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Day nav */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 8px', flexShrink: 0, gap: 8 }}>
          <button onClick={handlePrevDay} style={{ padding: '6px 14px', fontSize: 16 }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{today.label}</div>
          </div>
          <button
            onClick={() => { setWeekMonday(currentWeekMonday); setMobileDayIndex(getTodayDayIndex()) }}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            Today
          </button>
          <button onClick={handleNextDay} style={{ padding: '6px 14px', fontSize: 16 }}>›</button>
        </div>

        {/* Day column — scrollable, padded above bottom nav */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
          <DayColumn
            mobile
            day={today}
            weekMonday={weekMonday}
            householdId={householdId}
            tasks={todayTasks}
            members={members}
            currentUserId={currentUserId}
            draggingTaskId={draggingTaskId}
            onDragStart={setDraggingTaskId}
            onDragEnd={() => setDraggingTaskId(null)}
            onDrop={(taskId, dayWindow) => handleDrop(taskId, dayWindow)}
            onTaskClick={setSelectedTaskId}
            onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
            onTaskStateChanged={handleStateChange}
            onTaskDone={handleDone}
          />
        </div>

        {/* Bottom nav bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 56, background: '#1e1e2e',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', zIndex: 40,
        }}>
          {[
            { label: 'Backlog', icon: '📋', action: () => setShowBacklogSheet(true) },
            { label: 'Members', icon: '👥', action: () => setShowMembersSheet(true) },
            { label: 'Shopping', icon: '🛒', action: () => setShowShopping((s) => !s) },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, background: 'transparent',
                border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Backlog sheet */}
        {showBacklogSheet && (
          <BottomSheet title="Backlog" onClose={() => setShowBacklogSheet(false)}>
            <BacklogColumn
              mobile
              householdId={householdId}
              tasks={backlogTasks}
              members={members}
              currentUserId={currentUserId}
              draggingTaskId={draggingTaskId}
              onDragStart={setDraggingTaskId}
              onDragEnd={() => setDraggingTaskId(null)}
              onDrop={(taskId) => handleDrop(taskId, null)}
              onTaskClick={(id) => { setShowBacklogSheet(false); setSelectedTaskId(id) }}
              onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
              onTaskStateChanged={handleStateChange}
              onTaskDone={handleDone}
            />
          </BottomSheet>
        )}

        {/* Members sheet */}
        {showMembersSheet && (
          <BottomSheet title="Members" onClose={() => setShowMembersSheet(false)}>
            <MembersPanel mobile householdId={householdId} members={members} />
          </BottomSheet>
        )}

        {sharedPanels}
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────
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
        onToday={() => setWeekMonday(currentWeekMonday)}
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
          onTaskDone={handleDone}
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
            onTaskDone={handleDone}
          />
        ))}

        <MembersPanel householdId={householdId} members={members} />
      </div>

      {sharedPanels}
    </div>
  )
}
