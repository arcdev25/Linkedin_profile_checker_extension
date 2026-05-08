# Fix Permission Denied Error - Use Supabase Dashboard

## The Issue
You're getting "permission denied for schema public" because:
1. Row Level Security (RLS) is enabled
2. You don't have permission to disable it via SQL with the anon key

## Solution: Use Supabase Dashboard UI

### Step 1: Disable RLS via Dashboard

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Go to Authentication → Policies**
   - Click "Authentication" in left sidebar
   - Click "Policies" tab

3. **For EACH table (owners, recruiters, profiles, contacts, highlights, keywords, sessions, staging_contacts):**
   - Find the table in the list
   - Click the table name
   - Look for "Enable RLS" toggle
   - **Turn it OFF** (disable it)
   - Click "Save"

### Step 2: Alternative - Add RLS Policies

If you want to keep RLS enabled (more secure), add these policies:

1. **Go to Table Editor**
   - Click "Table Editor" in left sidebar
   - Select "owners" table
   - Click "RLS" button at top

2. **Add Policy for SELECT**
   - Click "New Policy"
   - Template: "Enable read access for all users"
   - Policy name: `Allow anon read`
   - Target roles: `anon`
   - USING expression: `true`
   - Click "Save"

3. **Repeat for all tables**

### Step 3: Easiest Solution - Use Service Role Key (Development Only)

⚠️ **WARNING: Only for development! Never use service role key in production!**

1. **Get Service Role Key**
   - Go to Settings → API
   - Copy "service_role" key (not anon key)

2. **Update .env file**
   ```
   REACT_APP_SUPABASE_URL=https://iotxnqhegxxjrvdkonyu.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-service-role-key-here
   ```

3. **Restart app**
   ```bash
   npm start
   ```

---

## Recommended: Disable RLS for Development

The simplest solution for development:

1. Go to **Table Editor** in Supabase Dashboard
2. For each table:
   - Click the table name
   - Click "..." menu (three dots)
   - Click "Edit table"
   - Scroll down to "Enable Row Level Security"
   - **Uncheck the box**
   - Click "Save"

3. Repeat for all 8 tables:
   - owners
   - recruiters
   - profiles
   - contacts
   - highlights
   - keywords
   - sessions
   - staging_contacts

---

## Quick Check

After disabling RLS, test in SQL Editor:

```sql
SELECT * FROM owners WHERE email = 'admin@system.com';
```

Should return the admin user without errors.

---

## For Production

When deploying to production, you should:
1. Re-enable RLS
2. Add proper policies
3. Use service role key only on backend
4. Use anon key on frontend with proper policies
