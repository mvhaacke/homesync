# HomeSync

Household planning app — shared weekly task calendar with meals and shopping list.

## Stack

| Layer     | Tech                                              |
|-----------|---------------------------------------------------|
| Frontend  | React 19 + TypeScript + Vite, deployed to Vercel |
| Database  | Supabase (Postgres + Auth + Edge Functions)       |
| Auth      | Supabase anon key + user JWT, RLS on all tables  |

No backend server. All data access goes through the Supabase JS client directly from the browser, with one Deno Edge Function for shopping list sync logic.

## Project Structure

```
homesync/
├── frontend/               # React/Vite app (deploy to Vercel)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts # Supabase browser client
│   │   │   └── api.ts      # All data access (supabase-js calls)
│   │   └── pages/          # SignIn, ProfileSetup, HouseholdSetup, WeeklyGrid
│   └── vercel.json         # SPA rewrite config
├── supabase/
│   ├── schema.sql          # Full DB schema + RLS policies
│   └── functions/
│       └── sync-shopping-list/  # Deno Edge Function
└── tasks/                  # Planning docs
```

## Getting Started

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor.

Also run the RLS helper function (required — prevents infinite recursion in `household_members` policy):

```sql
CREATE OR REPLACE FUNCTION get_my_household_ids()
RETURNS SETOF UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 2. Deploy the Edge Function

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy sync-shopping-list
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
pnpm install
pnpm dev
# → http://localhost:5173
```

Deploy to Vercel: connect the repo, set root to `frontend/`, add the two env vars.

## Features

- **Weekly calendar** — drag tasks to days, assign to household members
- **Task states** — proposed → accepted / counter-proposed / declined
- **Task types** — chore, meal, event, todo
- **Meal tasks** — attach ingredients (name, quantity, unit, category)
- **Shopping list** — sync aggregates ingredients from accepted meal tasks for the week; check off items as you shop

## Roadmap

- **LLM ingredient suggestions** — auto-fill ingredients from meal name via Claude
- **Household invites** — invite by email instead of sharing a raw UUID
- **Time/day suggestions** — LLM-assisted scheduling based on household preferences
- **Password reset** — `/reset-password` page catching Supabase magic links
