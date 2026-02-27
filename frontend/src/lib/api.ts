import { supabase } from './supabase'

// ---- Types ----

export interface Profile { id: string; display_name: string; color: string }
export interface UserHousehold { household_id: string; household_name: string; role: string }

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

// ---- Helper ----

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  return data.user!.id
}

// ---- API ----

export const api = {
  getMyProfile: async (): Promise<Profile> => {
    const id = await getUserId()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Profile not found')
    return data as Profile
  },

  upsertMyProfile: async (display_name: string, color: string): Promise<Profile> => {
    const id = await getUserId()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id, display_name, color })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Upsert failed')
    return data as Profile
  },

  getMyHouseholds: async (): Promise<UserHousehold[]> => {
    const id = await getUserId()
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, role, households(id, name)')
      .eq('user_id', id)
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      household_id: row.household_id,
      household_name: row.households?.name ?? '',
      role: row.role,
    }))
  },

  joinHousehold: async (householdId: string): Promise<HouseholdMember> => {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('household_members')
      .upsert(
        { household_id: householdId, user_id: userId, role: 'member' },
        { onConflict: 'household_id,user_id', ignoreDuplicates: true },
      )
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as HouseholdMember
  },

  createHousehold: async (name: string): Promise<Household> => {
    const userId = await getUserId()
    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name })
      .select()
      .single()
    if (hErr || !household) throw new Error(hErr?.message ?? 'Create failed')
    const { error: mErr } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: userId, role: 'admin' })
    if (mErr) throw new Error(mErr.message)
    return household as Household
  },

  getHousehold: async (id: string): Promise<Household> => {
    const { data, error } = await supabase
      .from('households')
      .select('*, household_members(user_id, role)')
      .eq('id', id)
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Not found')

    const userIds = ((data as any).household_members ?? []).map((m: any) => m.user_id)
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, display_name, color').in('id', userIds)
      : { data: [] }
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

    const members: HouseholdMember[] = ((data as any).household_members ?? []).map((m: any) => ({
      household_id: id,
      user_id: m.user_id,
      role: m.role,
      display_name: profileMap.get(m.user_id)?.display_name ?? null,
      color: profileMap.get(m.user_id)?.color ?? null,
    }))
    return { ...(data as any), members } as Household
  },

  addMember: async (householdId: string, userId: string, role = 'member'): Promise<HouseholdMember> => {
    const { data, error } = await supabase
      .from('household_members')
      .insert({ household_id: householdId, user_id: userId, role })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Insert failed')
    return data as HouseholdMember
  },

  // ---- Tasks ----

  listTasks: async (householdId: string, weekStart?: string): Promise<Task[]> => {
    let query = supabase.from('tasks').select('*').eq('household_id', householdId)
    if (weekStart) query = query.eq('week_start', weekStart)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as Task[]
  },

  createTask: async (householdId: string, task: CreateTaskPayload): Promise<Task> => {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, household_id: householdId, proposed_by: userId })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Create failed')
    return data as Task
  },

  patchTask: async (taskId: string, patch: Partial<Task>): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Patch failed')
    return data as Task
  },

  // ---- Shopping ----

  getShoppingList: async (householdId: string, weekStart: string): Promise<ShoppingItem[]> => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
    if (error) throw new Error(error.message)
    return (data ?? []) as ShoppingItem[]
  },

  syncShoppingList: async (householdId: string, weekStart: string): Promise<ShoppingItem[]> => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-shopping-list`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session!.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ household_id: householdId, week_start: weekStart }),
      },
    )
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
    return res.json() as Promise<ShoppingItem[]>
  },

  toggleShoppingItem: async (itemId: string, checked: boolean): Promise<ShoppingItem> => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ checked })
      .eq('id', itemId)
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Update failed')
    return data as ShoppingItem
  },
}
