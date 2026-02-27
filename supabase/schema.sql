-- HomeSync Database Schema
-- Apply via Supabase SQL editor or supabase db push

-- Users are managed by Supabase Auth (auth.users) — no custom users table needed.

CREATE TABLE households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE household_members (
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'member',  -- 'admin' | 'member'
  color        TEXT,                   -- calendar color per person
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     UUID REFERENCES households(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  task_type        TEXT NOT NULL DEFAULT 'chore',    -- 'chore'|'meal'|'event'|'todo'
  state            TEXT NOT NULL DEFAULT 'proposed', -- 'proposed'|'accepted'|'counter_proposed'|'declined'
  proposed_by      UUID REFERENCES auth.users(id),
  assigned_to      UUID REFERENCES auth.users(id),
  day_window       TEXT,     -- 'monday'..'sunday' | null = floating
  time_of_day      TEXT,     -- 'morning'|'afternoon'|'evening' | null
  duration_minutes INTEGER,
  week_start       DATE,     -- ISO week start (Monday)
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic — tighten in Phase 2)
-- household_members: users can see their own memberships
CREATE POLICY "members_see_own" ON household_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "members_insert_own" ON household_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- households: users can see households they belong to
CREATE POLICY "households_for_members" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "households_insert" ON households
  FOR INSERT WITH CHECK (true);

-- tasks: users can see tasks in their households
CREATE POLICY "tasks_for_members" ON tasks
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_for_members" ON tasks
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_for_members" ON tasks
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
