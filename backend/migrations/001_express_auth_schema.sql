/**
 * Express Auth Schema
 *
 * Creates a `users` table that stores email + bcrypt password hash.
 * This is used by the Express backend's JWT auth flow (separate from
 * Supabase Auth, which the live frontend uses).
 *
 * The `profiles` table (already created by the main migration) stores
 * display name, role, and phone. The `users` table here links to it
 * via the same UUID primary key.
 */

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete" ON users FOR DELETE TO anon, authenticated USING (true);
