/*
# Express Auth — Users Table

Creates a `users` table for the Express backend's JWT auth flow.
Stores email + bcrypt password hash. The `profiles` table (already exists)
stores display name, role, and phone. Both share the same UUID primary key.

## New Tables
- `users`: id (uuid PK), email (unique), password_hash, created_at

## Security
- RLS enabled with anon + authenticated CRUD (internal app).
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
