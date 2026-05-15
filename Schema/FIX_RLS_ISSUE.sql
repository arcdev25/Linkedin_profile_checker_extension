-- ============================================================
-- FIX 401 UNAUTHORIZED ERROR
-- This disables Row Level Security on all tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- Disable RLS on all tables
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE staging_contacts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('owners', 'recruiters', 'profiles', 'contacts', 'highlights', 'keywords', 'sessions', 'staging_contacts')
ORDER BY tablename;

-- Expected: All should show rls_enabled = false

-- ============================================================
-- Test query (should work now)
-- ============================================================

SELECT 
  name,
  email,
  role,
  status
FROM owners
WHERE email = 'admin@system.com';

-- Expected: Should return the admin user

-- ============================================================
-- DONE! Try logging in again
-- ============================================================
