# LinkedIn Profile Checker - Database Setup

## 🚀 Quick Start (Choose One)

### Option 1: New Database
Run `COMPLETE_SUPABASE_SCHEMA.sql` in Supabase SQL Editor

### Option 2: Existing Database  
Run `MIGRATION_ADD_NEED_RECONNECTION.sql` in Supabase SQL Editor

---

## 📁 All Database Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **COMPLETE_SUPABASE_SCHEMA.sql** | Full database setup | New project, no data |
| **MIGRATION_ADD_NEED_RECONNECTION.sql** | Add new features | Existing project with data |
| **database_schema_fix.sql** | Quick fix | Same as migration, simpler |
| **DATABASE_SETUP_GUIDE.md** | Complete guide | Detailed instructions |
| **QUICK_START_DATABASE.md** | Quick reference | Fast setup |
| **DATABASE_FILES_SUMMARY.md** | File overview | Understanding files |

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **RECRUITER_DELETION_BEHAVIOR.md** | How recruiter deletion works |
| **FAILED_CANDIDATES_RECONNECTION_GUIDE.md** | Feature guide |
| **DASHBOARD_OWNER_FILTERING.md** | Dashboard filtering |
| **AUTHENTICATION_GUIDE.md** | Auth system guide |

---

## 🎯 What You Need

### For New Project:
1. Read: `QUICK_START_DATABASE.md`
2. Run: `COMPLETE_SUPABASE_SCHEMA.sql`
3. Done!

### For Existing Project:
1. Read: `QUICK_START_DATABASE.md`
2. Backup your data
3. Run: `MIGRATION_ADD_NEED_RECONNECTION.sql`
4. Done!

---

## 🔑 Default Login

After setup:
- **Admin**: admin@system.com / admin123
- **Owner**: owner@test.com / owner123

---

## ✅ Verify Setup

```sql
-- Should work without error
UPDATE contacts 
SET status = 'need reconnection' 
WHERE id = (SELECT id FROM contacts LIMIT 1);
```

---

## 🆘 Need Help?

1. Check `QUICK_START_DATABASE.md` for common errors
2. Read `DATABASE_SETUP_GUIDE.md` for detailed help
3. See troubleshooting section in guides

---

## 📊 What Gets Created

- **5 Tables**: owners, recruiters, profiles, contacts, sessions
- **8 Status Values**: pending, chatting, sent js, not interested, success, failed, ghosted, need reconnection
- **2 Default Users**: admin and test owner
- **Proper Foreign Keys**: Preserves data on deletion

---

## 🎉 Ready to Go!

After running the SQL:
1. ✅ Database configured
2. ✅ Default users created
3. ✅ Ready to start React app
4. ✅ Login and test!
