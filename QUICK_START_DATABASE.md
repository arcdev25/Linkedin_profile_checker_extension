# Quick Start - Database Setup

## 🚀 Choose Your Path

### Path 1: New Database (No Data)
```sql
-- Run: COMPLETE_SUPABASE_SCHEMA.sql
-- Time: ~30 seconds
-- Result: Complete database with sample users
```

### Path 2: Existing Database (Has Data)
```sql
-- Run: MIGRATION_ADD_NEED_RECONNECTION.sql
-- Time: ~10 seconds
-- Result: Adds "need reconnection" feature to existing DB
```

---

## 📋 Quick Steps

### For New Database:
1. Open Supabase → SQL Editor
2. Copy `COMPLETE_SUPABASE_SCHEMA.sql`
3. Paste and Run
4. Done! ✅

### For Existing Database:
1. **BACKUP FIRST!**
   ```sql
   CREATE TABLE contacts_backup AS SELECT * FROM contacts;
   ```
2. Open Supabase → SQL Editor
3. Copy `MIGRATION_ADD_NEED_RECONNECTION.sql`
4. Paste and Run
5. Done! ✅

---

## 🔑 Default Logins

After running the schema:

**Admin Account:**
- Email: `admin@system.com`
- Password: `admin123`

**Test Owner Account:**
- Email: `owner@test.com`
- Password: `owner123`

---

## ✅ Verify It Worked

Run this query:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM contacts
GROUP BY status;
```

You should be able to set status to `'need reconnection'` without errors.

---

## 🆘 Got an Error?

### "check constraint violated"
Your existing data has invalid statuses.

**Fix:**
```sql
UPDATE contacts 
SET status = 'pending' 
WHERE status NOT IN (
  'pending', 'chatting', 'sent js', 'not interested',
  'success', 'failed', 'ghosted', 'need reconnection'
);
```
Then run the migration again.

### "foreign key constraint violated"
You have contacts pointing to deleted recruiters.

**Fix:**
```sql
UPDATE contacts 
SET recruiter_id = NULL
WHERE recruiter_id NOT IN (SELECT id FROM recruiters);
```
Then run the migration again.

---

## 📚 Full Documentation

See `DATABASE_SETUP_GUIDE.md` for complete details.
