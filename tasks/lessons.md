# Lessons Learned

_Updated after user corrections. Each entry is a rule to prevent repeating the same mistake._

---

## 2026-02 — RLS self-reference causes infinite recursion

**Mistake:** Writing a `household_members` SELECT policy that queries `household_members` in its own `USING` clause:
```sql
CREATE POLICY "members_see_household" ON household_members
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
```
This causes `infinite recursion detected in policy for relation "household_members"` at runtime.

**Rule:** When an RLS policy on table T needs to query T itself, wrap the subquery in a `SECURITY DEFINER` function. The function runs as superuser and bypasses RLS, breaking the recursion:
```sql
CREATE OR REPLACE FUNCTION get_my_household_ids()
RETURNS SETOF UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "members_see_household" ON household_members
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));
```

---

## 2026-02 — PostgREST nested selects require explicit FK

**Mistake:** Using supabase-js nested select syntax `household_members(user_id, role, profiles(display_name, color))` when there is no foreign key directly from `household_members.user_id` to `profiles.id`. Both columns reference `auth.users(id)` but not each other, so PostgREST has no relationship to traverse.

**Rule:** PostgREST nested selects only work along declared foreign key relationships. When there's no direct FK, do two separate queries and join client-side.

---

## 2026-02 — FastAPI service role bypasses RLS silently

**Mistake:** The FastAPI backend used the Supabase service role key, which bypasses RLS entirely. RLS policies on `household_members` were wrong (only showed the current user's own row) but the backend worked fine, masking the bug. Switching to client-side calls exposed it immediately.

**Rule:** When building APIs that use the service role key, verify RLS policies separately — they won't be tested by the backend at all.
