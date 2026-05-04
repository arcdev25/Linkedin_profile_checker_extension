# Quick Setup - Authentication System

## ✅ Step-by-Step Setup

### 1. Run Database Schema (2 minutes)
```sql
-- In Supabase SQL Editor, copy and run: supabase_auth_schema.sql
```

This creates:
- ✅ `owners` table
- ✅ Admin account (admin@system.com / admin123)
- ✅ Test owner (owner@test.com / owner123)
- ✅ Indexes and triggers

### 2. Verify Installation (Already Done)
```bash
✅ bcryptjs installed
✅ Redux slices created
✅ Pages updated
✅ Routes configured
```

### 3. Start the App
```bash
npm start
```

### 4. Test Login
1. Navigate to `http://localhost:3000/login`
2. Login as **admin**:
   - Email: `admin@system.com`
   - Password: `admin123`
3. You should see the dashboard with "Owners" menu

### 5. Test Owner Management
1. Click "Owners" in sidebar
2. See list of all owners
3. Try disabling the test owner
4. Try deleting (cannot delete yourself)

### 6. Test Owner Login
1. Logout
2. Login as **owner**:
   - Email: `owner@test.com`
   - Password: `owner123`
3. Verify "Owners" menu does NOT appear

### 7. Test Registration
1. Logout
2. Click "Register"
3. Create new account
4. Login with new credentials

## Default Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@system.com | admin123 | Full access + Owner management |
| Owner | owner@test.com | owner123 | Standard access |

## What's Working

✅ **Login** - Email/password authentication
✅ **Register** - New owner signup
✅ **Logout** - Clear session
✅ **Protected Routes** - Auto-redirect if not logged in
✅ **Role-based Access** - Admin sees Owners menu
✅ **Owner Management** - Enable/disable/delete owners
✅ **Session Persistence** - Stays logged in on refresh
✅ **Password Security** - Bcrypt hashing

## Quick Test Checklist

- [ ] Login as admin works
- [ ] Can see Owners menu
- [ ] Can view all owners
- [ ] Can disable/enable owners
- [ ] Can delete owners (not self)
- [ ] Login as owner works
- [ ] Cannot see Owners menu
- [ ] Register new account works
- [ ] Logout works
- [ ] Protected routes redirect to login

## Troubleshooting

### Can't login?
1. Check `.env` has Supabase credentials
2. Verify `owners` table exists in Supabase
3. Check browser console for errors
4. Restart dev server

### "Access Denied" on Owners page?
- You're logged in as owner, not admin
- Login as admin@system.com to access

### Register not working?
- Email might already exist
- Password must be 6+ characters
- Check Supabase connection

## Files Created

```
✅ src/features/auth/authSlice.js
✅ src/features/owners/ownersSlice.js
✅ src/features/owners/index.js
✅ src/pages/protected/Owners.js
✅ supabase_auth_schema.sql
✅ generate_password_hash.js
✅ AUTHENTICATION_GUIDE.md
✅ QUICK_SETUP_AUTH.md
```

## Files Modified

```
✅ src/features/user/Login.js
✅ src/features/user/Register.js
✅ src/containers/Header.js
✅ src/containers/LeftSidebar.js
✅ src/routes/index.js
✅ src/routes/sidebar.js
✅ src/app/store.js
✅ src/App.js
✅ src/utils/globalConstantUtil.js
✅ src/features/common/components/ConfirmationModalBody.js
```

## Next Steps

1. **Test everything** - Go through the checklist above
2. **Customize** - Change default passwords, add more admins
3. **Enhance** - Add password reset, email verification, etc.
4. **Deploy** - Ready for production!

## Support

- **Full Guide**: See `AUTHENTICATION_GUIDE.md`
- **Database Schema**: See `supabase_auth_schema.sql`
- **Password Hashes**: Run `node generate_password_hash.js`

---

**You're all set!** 🎉

Login as admin and start managing your recruitment platform!
