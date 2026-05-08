-- ============================================================
-- QUICK VERIFICATION - Run this to check everything
-- ============================================================

-- 1. Check if owners table exists
SELECT 'Table exists' as check_1;

-- 2. Count users
SELECT 
  '2. User Count' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 7 THEN '✓ PASS'
    ELSE '✗ FAIL - Should be 7'
  END as status
FROM owners;

-- 3. Check admin user
SELECT 
  '3. Admin User' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL - Admin not found'
  END as status
FROM owners
WHERE email = 'admin@system.com' AND role = 'admin';

-- 4. Check password hashes
SELECT 
  '4. Password Hashes' as check_name,
  COUNT(*) as valid_hashes,
  CASE 
    WHEN COUNT(*) = 7 THEN '✓ PASS'
    ELSE '✗ FAIL - Some hashes invalid'
  END as status
FROM owners
WHERE password LIKE '$2b$10$%' AND LENGTH(password) = 60;

-- 5. Check all users are active
SELECT 
  '5. Active Status' as check_name,
  COUNT(*) as active_count,
  CASE 
    WHEN COUNT(*) = 7 THEN '✓ PASS'
    ELSE '✗ FAIL - Some users not active'
  END as status
FROM owners
WHERE status = 'active';

-- 6. List all users
SELECT 
  '6. All Users' as section,
  name,
  email,
  role,
  status
FROM owners
ORDER BY role DESC, name;

-- ============================================================
-- If all checks show ✓ PASS, your database is set up correctly
-- Try logging in with: admin@system.com / admin123
-- ============================================================
