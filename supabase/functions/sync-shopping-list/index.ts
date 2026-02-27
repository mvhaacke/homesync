import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Use user's JWT so RLS applies
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { household_id, week_start } = await req.json() as {
    household_id: string
    week_start: string
  }

  // 1. Fetch accepted meal tasks for that household/week
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('ingredients')
    .eq('household_id', household_id)
    .eq('week_start', week_start)
    .eq('task_type', 'meal')
    .eq('state', 'accepted')

  if (tasksErr) {
    return new Response(JSON.stringify({ error: tasksErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Aggregate ingredients: group by (name.lower(), unit), sum quantities
  const aggregated = new Map<string, { name: string; quantity: number | null; unit: string | null; category: string }>()

  for (const task of tasks ?? []) {
    const ingredients: Array<{ name: string; quantity?: number | null; unit?: string | null; category?: string }> =
      task.ingredients ?? []
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}||${ing.unit ?? ''}`
      const existing = aggregated.get(key)
      if (existing) {
        if (existing.quantity != null && ing.quantity != null) {
          existing.quantity += ing.quantity
        } else if (ing.quantity != null) {
          existing.quantity = ing.quantity
        }
      } else {
        aggregated.set(key, {
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          category: ing.category ?? 'other',
        })
      }
    }
  }

  // 3. Fetch checked item names to preserve
  const { data: checkedItems } = await supabase
    .from('shopping_list_items')
    .select('name')
    .eq('household_id', household_id)
    .eq('week_start', week_start)
    .eq('checked', true)

  const checkedNames = new Set((checkedItems ?? []).map((r: { name: string }) => r.name.toLowerCase()))

  // 4. Delete unchecked items
  await supabase
    .from('shopping_list_items')
    .delete()
    .eq('household_id', household_id)
    .eq('week_start', week_start)
    .eq('checked', false)

  // 5. Insert new items, skipping already-checked names
  const newItems = Array.from(aggregated.values())
    .filter(item => !checkedNames.has(item.name.toLowerCase()))
    .map(item => ({
      household_id,
      week_start,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: false,
    }))

  if (newItems.length > 0) {
    await supabase.from('shopping_list_items').insert(newItems)
  }

  // Return all items for that household/week
  const { data: allItems, error: listErr } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('household_id', household_id)
    .eq('week_start', week_start)

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(allItems), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
