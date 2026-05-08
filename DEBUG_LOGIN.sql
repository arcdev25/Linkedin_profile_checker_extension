-- ============================================================
-- DEBUG LOGIN ISSUES
-- Run these queries in Supabase SQL Editor to diagnose
-- ============================================================

-- STEP 1: Check if owners table exists and has data
SELECT 
  id,
  name,
  email,
  role,
  status,
  created_at,
  LENGTH(password) as password_length
FROM owners
ORDER BY created_at;

-- Expected: Should show 7 users (1 admin + 6 owners)
-- If empty, the INSERT statements didn't run

-- ============================================================

-- STEP 2: Check specific user (try admin)
SELECT 
  id,
  name,
  email,
  password,
  role,
  status
FROM owners
WHERE email = 'admin@system.com';

-- Expected: Should return 1 row with admin data
-- Password should be a long bcrypt hash starting with $2b$10$

-- ============================================================

-- STEP 3: Check if password hash is correct
SELECT 
  email,
  password,
  CASE 
    WHEN password LIKE '$2b$10$%' THEN 'Valid bcrypt hash'
    ELSE 'Invalid hash format'
  END as hash_status
FROM owners;

-- Expected: All should show "Valid bcrypt hash"

-- ============================================================

-- STEP 4: Try to manually verify a login
-- This simulates what the app does
SELECT 
  id,
  name,
  email,
  role,
  status,
  password
FROM owners
WHERE email = 'admin@system.com'
  AND status = 'active';

-- Expected: Should return the admin user
-- Copy the password hash and we'll test it

-- ============================================================

-- STEP 5: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'owners'
ORDER BY ordinal_position;

-- Expected: Should show all columns including password

-- ============================================================

-- STEP 6: Count all users
SELECT 
  role,
  status,
  COUNT(*) as count
FROM owners
GROUP BY role, status;

-- Expected: 
-- admin, active, 1
-- owner, active, 6
