import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...init.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ---- Households ----

export interface Household {
  id: string
  name: string
  created_at: string
  members?: HouseholdMember[]
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: string
  color: string | null
}

export const api = {
  createHousehold: (name: string) =>
    request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getHousehold: (id: string) => request<Household>(`/households/${id}`),

  addMember: (householdId: string, userId: string, role = 'member') =>
    request<HouseholdMember>(`/households/${householdId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    }),

  // ---- Tasks ----

  listTasks: (householdId: string, weekStart?: string) => {
    const qs = weekStart ? `?week_start=${weekStart}` : ''
    return request<Task[]>(`/households/${householdId}/tasks${qs}`)
  },

  createTask: (householdId: string, task: CreateTaskPayload) =>
    request<Task>(`/households/${householdId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  patchTask: (taskId: string, patch: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}

export interface Task {
  id: string
  household_id: string
  title: string
  description: string | null
  task_type: string
  state: string
  proposed_by: string | null
  assigned_to: string | null
  day_window: string | null
  time_of_day: string | null
  duration_minutes: number | null
  week_start: string | null
  created_at: string
  updated_at: string
}

export type CreateTaskPayload = Pick<Task, 'title'> &
  Partial<
    Pick<
      Task,
      | 'description'
      | 'task_type'
      | 'assigned_to'
      | 'day_window'
      | 'time_of_day'
      | 'duration_minutes'
      | 'week_start'
    >
  >
