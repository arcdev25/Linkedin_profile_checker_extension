# Database Setup Files - Summary

## 📁 Files Overview

### 1. **COMPLETE_SUPABASE_SCHEMA.sql** ⭐ RECOMMENDED FOR NEW PROJECTS
**Use when:** Starting fresh with no existing data

**What it does:**
- Creates all tables from scratch
- Sets up proper foreign keys and constraints
- Creates indexes for performance
- Adds triggers for auto-updating timestamps
- Inserts default admin and test owner accounts
- Includes verification queries

**Time:** ~30 seconds

**Result:** Complete, production-ready database

---

### 2. **MIGRATION_ADD_NEED_RECONNECTION.sql** ⭐ RECOMMENDED FOR EXISTING PROJECTS
**Use when:** You already have data in your database

**What it does:**
- Updates existing invalid statuses to 'pending'
- Adds "need reconnection" to status constraint
- Fixes foreign key to use SET NULL
- Preserves all existing data
- Includes verification queries

**Time:** ~10 seconds

**Result:** Existing database updated with new features

---

### 3. **database_schema_fix.sql**
**Use when:** Quick fix for existing database (same as #2 but simpler)

**What it does:**
- Same as MIGRATION_ADD_NEED_RECONNECTION.sql
- Slightly different format

---

### 4. **DATABASE_SETUP_GUIDE.md** 📖
**Complete documentation** with:
- Step-by-step instructions
- Schema overview
- Troubleshooting guide
- Verification queries
- Relationship diagrams

---

### 5. **QUICK_START_DATABASE.md** 🚀
**Quick reference card** with:
- Fast setup steps
- Default login credentials
- Common error fixes
- One-page overview

---

## 🎯 Which File Should I Use?

### Scenario A: Brand New Project
```
Use: COMPLETE_SUPABASE_SCHEMA.sql
Why: Sets up everything correctly from the start
```

### Scenario B: Existing Project with Data
```
Use: MIGRATION_ADD_NEED_RECONNECTION.sql
Why: Safely updates your existing database
```

### Scenario C: Just Need Quick Fix
```
Use: database_schema_fix.sql
Why: Same as Scenario B, just simpler
```

---

## ⚡ Quick Start

### New Database:
```bash
1. Open Supabase SQL Editor
2. Copy COMPLETE_SUPABASE_SCHEMA.sql
3. Paste and Run
4. Login with admin@system.com / admin123
```

### Existing Database:
```bash
1. Backup: CREATE TABLE contacts_backup AS SELECT * FROM contacts;
2. Open Supabase SQL Editor
3. Copy MIGRATION_ADD_NEED_RECONNECTION.sql
4. Paste and Run
5. Verify with: SELECT DISTINCT status FROM contacts;
```

---

## 🔑 Default Credentials

After running COMPLETE_SUPABASE_SCHEMA.sql:

**Admin:**
- Email: admin@system.com
- Password: admin123

**Test Owner:**
- Email: owner@test.com
- Password: owner123

---

## ✅ How to Verify It Worked

Run this query:
```sql
-- Should return all 8 statuses including "need reconnection"
SELECT 
  unnest(string_to_array(
    substring(
      check_clause from '\((.*)\)'
    ), 
    ','
  )) as valid_status
FROM information_schema.check_constraints
WHERE constraint_name = 'contacts_status_check';
```

Or simply:
```sql
-- This should work without error
UPDATE contacts 
SET status = 'need reconnection' 
WHERE id = (SELECT id FROM contacts LIMIT 1);
```

---

## 🆘 Common Errors & Fixes

### Error: "check constraint violated"
```sql
-- Fix: Update invalid statuses first
UPDATE contacts 
SET status = 'pending' 
WHERE status NOT IN (
  'pending', 'chatting', 'sent js', 'not interested',
  'success', 'failed', 'ghosted', 'need reconnection'
);
```

### Error: "foreign key constraint violated"
```sql
-- Fix: Clean up orphaned references
UPDATE contacts 
SET recruiter_id = NULL
WHERE recruiter_id NOT IN (SELECT id FROM recruiters);
```

### Error: "relation already exists"
```
Fix: You're using the wrong file!
- If tables exist → Use MIGRATION_ADD_NEED_RECONNECTION.sql
- If tables don't exist → Use COMPLETE_SUPABASE_SCHEMA.sql
```

---

## 📊 Database Schema Summary

```
owners (users)
  ├─→ recruiters (team members)
  │     ├─→ contacts (contact records)
  │     │     └─→ profiles (LinkedIn profiles)
  │     │
  │     └─ ON DELETE SET NULL ← IMPORTANT!
  │        (preserves contacts when recruiter deleted)
  │
  └─→ sessions (login sessions)
```

### Key Features:
- ✅ Contacts preserved when recruiter deleted
- ✅ Failed candidates stay failed
- ✅ Other candidates move to "need reconnection"
- ✅ Owner-based filtering
- ✅ Admin sees everything

---

## 📚 Full Documentation

For complete details, see:
- `DATABASE_SETUP_GUIDE.md` - Complete guide
- `QUICK_START_DATABASE.md` - Quick reference
- `RECRUITER_DELETION_BEHAVIOR.md` - How deletion works
- `FAILED_CANDIDATES_RECONNECTION_GUIDE.md` - Feature guide

---

## 🎉 You're Ready!

After running the appropriate SQL file:
1. ✅ Database is set up correctly
2. ✅ Foreign keys preserve data
3. ✅ Status constraints include "need reconnection"
4. ✅ Ready to use the application

**Next:** Start the React app and login with the default credentials!
