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

// ---- Profiles ----

export interface Profile { id: string; display_name: string; color: string }
export interface UserHousehold { household_id: string; household_name: string; role: string }

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
  display_name: string | null
}

export const api = {
  getMyProfile: () => request<Profile>('/me/profile'),
  upsertMyProfile: (display_name: string, color: string) =>
    request<Profile>('/me/profile', { method: 'PUT', body: JSON.stringify({ display_name, color }) }),
  getMyHouseholds: () => request<UserHousehold[]>('/me/households'),
  joinHousehold: (householdId: string) =>
    request<HouseholdMember>(`/households/${householdId}/join`, { method: 'POST' }),

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

  // ---- Shopping ----

  getShoppingList: (householdId: string, weekStart: string) =>
    request<ShoppingItem[]>(`/households/${householdId}/shopping-list?week_start=${weekStart}`),

  syncShoppingList: (householdId: string, weekStart: string) =>
    request<ShoppingItem[]>(`/households/${householdId}/shopping-list/sync?week_start=${weekStart}`, {
      method: 'POST',
    }),

  toggleShoppingItem: (itemId: string, checked: boolean) =>
    request<ShoppingItem>(`/shopping-list-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ checked }),
    }),
}

export interface Ingredient {
  name: string
  quantity: number | null
  unit: string | null
  category: string
}

export interface ShoppingItem {
  id: string
  household_id: string
  week_start: string
  name: string
  quantity: number | null
  unit: string | null
  category: string
  checked: boolean
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
  ingredients: Ingredient[]
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
      | 'ingredients'
    >
  >
