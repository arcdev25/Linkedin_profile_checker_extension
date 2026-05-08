-- ============================================================
-- FIX LOGIN ISSUES
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Check if users exist
SELECT COUNT(*) as user_count FROM owners;

-- If count is 0, users weren't created. Run the inserts below.
-- If count > 0, skip to STEP 2

-- ============================================================
-- STEP 1B: Insert users (only if count was 0)
-- ============================================================

-- Delete any existing users first (optional, only if you want fresh start)
-- DELETE FROM owners;

-- Insert admin
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'System Admin',
  'admin@system.com',
  '$2b$10$q7o64Tc2NMk6r4xL1Xpbcu.sZEOMZLdU8/kO7MqT04/KREU4mNwHu',
  'admin',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert Faker
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Faker',
  'Faker@owner.com',
  '$2b$10$sECRcIZAxE9rzfpWzm3ioeimIO1puayFHa8fYYasqkGZTZ8m8XgRe',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert Yura
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Yura',
  'Yura@owner.com',
  '$2b$10$XkV0HY/KUTPAF3CRjYY0rO3C.VUB88JHwta7l3VSKJAAOTS9mRTxq',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert 0xGiant
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  '0xGiant',
  '0xGiant@owner.com',
  '$2b$10$OoiazlcEU1FTjmhjSgmtDeUJfKYkaYDQLhsE3rK3AzU170KVAIB3e',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert 0xStrong
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  '0xStrong',
  '0xStrong@owner.com',
  '$2b$10$a7GJ.YYEQ7ecZoOy0PQlbO9kVL9.7hfuC.6aXUIBXaqfj9o.w3Doi',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert Voldmot
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Voldmot',
  'Voldmot@owner.com',
  '$2b$10$UovMlOb2OdUlyeH4zaegZOJB4JGXq2Ta2DsdNjORN1BTpkkLwEfda',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert Rape
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Rape',
  'Rape@owner.com',
  '$2b$10$pa05fcUM/.PwPlQlP4wynOmNEXYZmGkSO3z3TUSF.nvOmZ9n36J1q',
  'owner',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ============================================================
-- STEP 2: Verify users were created
-- ============================================================

SELECT 
  name,
  email,
  role,
  status,
  LENGTH(password) as password_hash_length,
  CASE 
    WHEN password LIKE '$2b$10$%' THEN '✓ Valid'
    ELSE '✗ Invalid'
  END as hash_format
FROM owners
ORDER BY role DESC, name;

-- Expected output:
-- 7 rows with password_hash_length = 60 and hash_format = '✓ Valid'

-- ============================================================
-- STEP 3: Test a specific login
-- ============================================================

-- This query simulates what happens when you try to login
SELECT 
  id,
  name,
  email,
  role,
  status,
  'Password hash exists' as password_check
FROM owners
WHERE email = 'admin@system.com'
  AND status = 'active';

-- Expected: Should return 1 row for admin user

-- ============================================================
-- DONE!
-- ============================================================

-- Now try logging in with:
-- Email: admin@system.com
-- Password: admin123
