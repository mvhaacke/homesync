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
  proposed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Helper: returns household IDs for the current user (SECURITY DEFINER breaks RLS recursion)
CREATE OR REPLACE FUNCTION get_my_household_ids()
RETURNS SETOF UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies
-- household_members: users can see all members of households they belong to
CREATE POLICY "members_see_household" ON household_members
  FOR SELECT USING (
    household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "members_delete_admin" ON household_members
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

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

CREATE POLICY "tasks_delete_proposed_by" ON tasks
  FOR DELETE USING (proposed_by = auth.uid());

-- Phase 3: profiles table
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  color        TEXT NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Meal template library
CREATE TABLE meal_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  ingredients  JSONB NOT NULL DEFAULT '[]',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, name)
);

ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_templates_select" ON meal_templates
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "meal_templates_insert" ON meal_templates
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "meal_templates_update" ON meal_templates
  FOR UPDATE USING (household_id IN (SELECT get_my_household_ids()));

-- Phase 5: household_invites table
CREATE TABLE household_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token        UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ DEFAULT now() + interval '7 days',
  used_at      TIMESTAMPTZ
);

ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_insert_members" ON household_invites
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "invites_select_auth" ON household_invites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invites_delete_members" ON household_invites
  FOR DELETE USING (household_id IN (SELECT get_my_household_ids()));
