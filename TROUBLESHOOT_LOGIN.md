# Troubleshooting Login Issues

## Quick Fix Steps

### Step 1: Run FIX_LOGIN_ISSUE.sql
1. Open Supabase SQL Editor
2. Copy and paste `FIX_LOGIN_ISSUE.sql`
3. Run it
4. Check the output - you should see 7 users

### Step 2: Verify in Supabase Dashboard
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "owners" table
4. You should see 7 rows

### Step 3: Check Browser Console
1. Open your app
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Try to login
5. Look for error messages

---

## Common Issues & Solutions

### Issue 1: "Invalid email or password" - Users Don't Exist

**Symptom**: Login fails immediately

**Check**:
```sql
SELECT COUNT(*) FROM owners;
```

**Solution**: If count is 0, run `FIX_LOGIN_ISSUE.sql`

---

### Issue 2: Email Case Sensitivity

**Symptom**: Login works with lowercase but not mixed case

**Check**: Are you typing the email exactly as shown?
- ✓ Correct: `admin@system.com`
- ✗ Wrong: `Admin@system.com`
- ✓ Correct: `Faker@owner.com`
- ✗ Wrong: `faker@owner.com`

**Solution**: Use exact email from `DEFAULT_CREDENTIALS.md`

---

### Issue 3: Password Hash Not Matching

**Symptom**: Email found but password fails

**Check**:
```sql
SELECT 
  email,
  LENGTH(password) as hash_length,
  LEFT(password, 10) as hash_start
FROM owners
WHERE email = 'admin@system.com';
```

**Expected**:
- hash_length: 60
- hash_start: $2b$10$q7o

**Solution**: If different, run `FIX_LOGIN_ISSUE.sql`

---

### Issue 4: Supabase Connection Error

**Symptom**: Network error or timeout

**Check**: Open `.env` file and verify:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

**Solution**: 
1. Go to Supabase Dashboard → Settings → API
2. Copy the correct URL and anon key
3. Update `.env` file
4. Restart your React app

---

### Issue 5: bcryptjs Not Installed

**Symptom**: Error about bcrypt module

**Solution**:
```bash
npm install bcryptjs
```

---

### Issue 6: User Status is 'disabled'

**Check**:
```sql
SELECT email, status FROM owners;
```

**Solution**: If status is 'disabled', update it:
```sql
UPDATE owners 
SET status = 'active' 
WHERE email = 'admin@system.com';
```

---

## Debug Queries

### Check if user exists:
```sql
SELECT * FROM owners WHERE email = 'admin@system.com';
```

### Check password hash format:
```sql
SELECT 
  email,
  password,
  CASE 
    WHEN password LIKE '$2b$10$%' THEN 'Valid bcrypt'
    ELSE 'Invalid format'
  END as hash_check
FROM owners;
```

### Test password manually:
Run `test_password.js`:
```bash
node test_password.js
```

---

## Step-by-Step Login Test

1. **Open Browser Console** (F12)

2. **Try to login** with:
   - Email: `admin@system.com`
   - Password: `admin123`

3. **Check Console for errors**:
   - Network tab: Look for failed requests
   - Console tab: Look for JavaScript errors

4. **Check Network Request**:
   - Should see POST to Supabase
   - Check response - does it return user data?

5. **Check localStorage**:
   - Console: `localStorage.getItem('user')`
   - Should show user object after successful login

---

## Manual Test in Supabase

Run this in SQL Editor:
```sql
-- This simulates the login process
WITH user_lookup AS (
  SELECT * FROM owners 
  WHERE email = 'admin@system.com'
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'User not found'
    WHEN MAX(status) = 'disabled' THEN 'User disabled'
    WHEN MAX(password) LIKE '$2b$10$%' THEN 'User found, hash valid'
    ELSE 'User found, hash invalid'
  END as login_status
FROM user_lookup;
```

Expected: `User found, hash valid`

---

## Still Not Working?

### Option 1: Fresh Database
```sql
-- Delete all users
DELETE FROM owners;

-- Run FIX_LOGIN_ISSUE.sql again
```

### Option 2: Check React App
1. Clear browser cache
2. Clear localStorage: `localStorage.clear()`
3. Restart React app: `npm start`
4. Try login again

### Option 3: Test with curl
```bash
# Test Supabase connection
curl -X POST 'https://your-project.supabase.co/rest/v1/owners?select=*&email=eq.admin@system.com' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

---

## Contact Info

If still having issues, provide:
1. Output of `SELECT * FROM owners;`
2. Browser console errors
3. Network tab screenshot
4. Which email/password you're trying
