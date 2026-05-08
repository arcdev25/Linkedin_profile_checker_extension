# Complete Database Setup Guide

## Choose Your Scenario

### Scenario A: Fresh Database (No Existing Data)
Use `COMPLETE_SUPABASE_SCHEMA.sql`

### Scenario B: Existing Database (Has Data)
Use `MIGRATION_ADD_NEED_RECONNECTION.sql`

---

## Scenario A: Fresh Database Setup

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run Complete Schema
1. Copy all contents from `COMPLETE_SUPABASE_SCHEMA.sql`
2. Paste into the SQL Editor
3. Click "Run" or press Ctrl+Enter

### Step 3: Verify Setup
The script will automatically show verification results at the end:
- ✓ 5 tables created (owners, recruiters, profiles, contacts, sessions)
- ✓ Foreign keys with correct DELETE rules
- ✓ Check constraints for status and role
- ✓ All indexes created
- ✓ 2 default users created

### Default Login Credentials
- **Admin**: 
  - Email: `admin@system.com`
  - Password: `admin123`
- **Test Owner**: 
  - Email: `owner@test.com`
  - Password: `owner123`

---

## Scenario B: Existing Database Migration

### Step 1: Backup Your Data (IMPORTANT!)
```sql
-- Run this first to backup your contacts
CREATE TABLE contacts_backup AS 
SELECT * FROM contacts;

-- Verify backup
SELECT COUNT(*) FROM contacts_backup;
```

### Step 2: Run Migration
1. Open Supabase SQL Editor
2. Copy all contents from `MIGRATION_ADD_NEED_RECONNECTION.sql`
3. Paste into the SQL Editor
4. Click "Run"

### Step 3: Verify Migration
The script will show:
- Status constraint with "need reconnection" included
- Foreign key with delete_rule = "SET NULL"
- Current status distribution

### Step 4: Test the Changes
```sql
-- Test 1: Check if "need reconnection" status works
UPDATE contacts 
SET status = 'need reconnection' 
WHERE id = (SELECT id FROM contacts LIMIT 1);

-- Test 2: Verify it was updated
SELECT status, COUNT(*) 
FROM contacts 
GROUP BY status;

-- Test 3: Rollback test change
UPDATE contacts 
SET status = 'pending' 
WHERE status = 'need reconnection';
```

---

## Database Schema Overview

### Tables

#### 1. owners
Stores user accounts (admin and owners)
```
- id (UUID, primary key)
- name (TEXT)
- email (TEXT, unique)
- password (TEXT, bcrypt hash)
- role (TEXT: 'admin' or 'owner')
- status (TEXT: 'active' or 'disabled')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. recruiters
Stores recruiting team members
```
- id (UUID, primary key)
- name (TEXT)
- email (TEXT)
- company (TEXT)
- owner_id (UUID, foreign key → owners.id, ON DELETE SET NULL)
- created_at (TIMESTAMPTZ)
```

#### 3. profiles
Stores LinkedIn profiles being tracked
```
- id (UUID, primary key)
- linkedin_id (TEXT, unique)
- name (TEXT)
- headline (TEXT)
- profile_url (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 4. contacts
Stores contact records between recruiters and profiles
```
- id (UUID, primary key)
- profile_id (UUID, foreign key → profiles.id, ON DELETE CASCADE)
- recruiter_id (UUID, foreign key → recruiters.id, ON DELETE SET NULL)
- status (TEXT: see valid statuses below)
- notes (TEXT)
- contacted_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- UNIQUE(profile_id, recruiter_id)
```

**Valid Status Values:**
- `pending` - Initial contact made
- `chatting` - Active conversation
- `sent js` - Job specification sent
- `not interested` - Candidate declined
- `success` - Successfully hired
- `failed` - Failed attempt
- `ghosted` - No response
- `need reconnection` - Recruiter deleted, needs new assignment

#### 5. sessions
Optional table for session management
```
- id (UUID, primary key)
- owner_id (UUID, foreign key → owners.id, ON DELETE CASCADE)
- token (TEXT, unique)
- expires_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

### Key Relationships

```
owners (1) ──→ (many) recruiters
  └─ ON DELETE SET NULL (recruiter.owner_id becomes NULL)

recruiters (1) ──→ (many) contacts
  └─ ON DELETE SET NULL (contact.recruiter_id becomes NULL)
     ⚠️ This is CRITICAL - preserves contacts when recruiter deleted

profiles (1) ──→ (many) contacts
  └─ ON DELETE CASCADE (deletes contacts when profile deleted)
```

---

## Troubleshooting

### Error: "check constraint violated"
**Problem:** Existing data has invalid status values

**Solution:**
```sql
-- Check what statuses exist
SELECT DISTINCT status FROM contacts;

-- Update invalid statuses
UPDATE contacts 
SET status = 'pending' 
WHERE status NOT IN (
  'pending', 'chatting', 'sent js', 'not interested',
  'success', 'failed', 'ghosted', 'need reconnection'
);
```

### Error: "foreign key constraint violated"
**Problem:** recruiter_id references non-existent recruiter

**Solution:**
```sql
-- Find orphaned contacts
SELECT c.id, c.recruiter_id 
FROM contacts c
LEFT JOIN recruiters r ON c.recruiter_id = r.id
WHERE c.recruiter_id IS NOT NULL 
  AND r.id IS NULL;

-- Fix by setting to NULL
UPDATE contacts 
SET recruiter_id = NULL
WHERE recruiter_id NOT IN (SELECT id FROM recruiters);
```

### Error: "relation already exists"
**Problem:** Tables already exist

**Solution:** The schema uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. If it does, you're running the wrong script. Use `MIGRATION_ADD_NEED_RECONNECTION.sql` instead.

---

## Verification Queries

### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('owners', 'recruiters', 'profiles', 'contacts', 'sessions')
ORDER BY table_name;
```

### Check Foreign Key Constraints
```sql
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

### Check Status Constraint
```sql
SELECT cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contacts'
  AND tc.constraint_name = 'contacts_status_check';
```

### Count Records
```sql
SELECT 
  'owners' as table_name, COUNT(*) as count FROM owners
UNION ALL
SELECT 'recruiters', COUNT(*) FROM recruiters
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts;
```

---

## Next Steps

After running the schema:

1. ✅ Verify all tables exist
2. ✅ Check foreign key constraints are correct
3. ✅ Test login with default credentials
4. ✅ Create your first recruiter
5. ✅ Add some test profiles
6. ✅ Create contacts
7. ✅ Test deleting a recruiter (contacts should move to "need reconnection")

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Run the verification queries
3. Check Supabase logs for detailed error messages
4. Ensure you're using the correct script for your scenario
