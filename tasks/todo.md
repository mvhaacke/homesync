# HomeSync — Task Board

## Done

### Phase 1: Foundation
- [x] Supabase project (Postgres + Auth)
- [x] React + TypeScript + Vite frontend
- [x] Supabase auth (sign up / sign in)
- [x] Data model: households, household_members, tasks, profiles
- [x] Profile setup (display name + color)
- [x] Household create / join flow

### Phase 2: Weekly Planning Loop
- [x] Weekly calendar grid (day columns, floating tasks panel)
- [x] Drag tasks to days
- [x] Task states: proposed → accepted | counter_proposed | declined
- [x] Color-coded by assigned member
- [x] Task types: chore, meal, event, todo

### Phase 3: Meals + Shopping
- [x] Meal tasks with ingredients (name, quantity, unit, category)
- [x] Shopping list panel with week selector
- [x] Sync: aggregates ingredients from accepted meals, deduplicates by name+unit
- [x] Check off shopping items (persisted)

### Phase 4: Zero-Python Migration
- [x] Replaced FastAPI backend with direct Supabase JS client calls
- [x] Shopping sync logic ported to Deno Edge Function
- [x] Fixed RLS infinite recursion on household_members (SECURITY DEFINER function)
- [x] Vercel deploy config (SPA rewrite)

---

## Up Next

### LLM: Ingredient suggestions
When a meal task is named, call a Claude Edge Function to suggest a default ingredient list. User can edit before saving.

### Household invites
Edge Function using `supabase.auth.admin.inviteUserByEmail()` so users can invite by email instead of sharing a raw UUID.

### LLM: Time/day suggestions
Single-turn prompt suggesting which day to schedule a task based on household patterns.

### Password reset page
Catch the Supabase magic link at `/reset-password` and let the user set a new password.

### Polish
- Mobile layout
- Floating to-do list (tasks with no day assigned)
- Drag to time slots within a day
