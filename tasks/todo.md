# HomeSync — Task Board

## Phase 1: Foundation
- [ ] Init FastAPI project structure
- [ ] Create Supabase project (Postgres + Auth)
- [ ] Init React + TypeScript frontend
- [ ] Wire frontend ↔ backend (CORS, env vars)
- [ ] Define data model in SQL + Pydantic schemas
- [ ] Implement Supabase auth (sign up / sign in)
- [ ] First API routes: `POST /tasks`, `GET /household/{id}/tasks`

## Phase 2: Weekly Planning Loop
- [ ] Availability input (fixed blocks per person per week)
- [ ] Proposal board (list view + state transitions)
- [ ] Task states: proposed → accepted | counter_proposed | declined
- [ ] Weekly grid view (day-level, no time slots yet)
- [ ] Color-coded by person, free time visible

## Phase 3: Recommendation Engine
- [ ] Calculate total assigned minutes per person
- [ ] Detect overload / scheduling conflicts
- [ ] Suggest re-balancing moves
- [ ] Minimum free-time buffer check

## Phase 4: Meals + Shopping
- [ ] Meal metadata (duration, cook, cleanup, ingredients)
- [ ] Ingredient aggregation from accepted meals
- [ ] Deduplicated shopping list
- [ ] Shopping trip as a task linked to meals

## Phase 5: Polish
- [ ] Drag to time slots
- [ ] Mobile layout
- [ ] Notifications / reminders
- [ ] Floating to-do list (non-scheduled tasks)

---

## Review
_Added after completion of each phase._