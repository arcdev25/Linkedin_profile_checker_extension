# Owner Filtering & Session Persistence Fix

## Issues Fixed

### ✅ Issue 1: Owner sees all recruiters
**Problem**: All owners could see all recruiters regardless of who created them.

**Solution**: Filter recruiters by `owner_id` based on logged-in user's role.

### ✅ Issue 2: Logout on page refresh
**Problem**: User gets logged out when refreshing the page.

**Solution**: Improved session persistence and auth check logic.

## Changes Made

### 1. Account Slice - Owner Filtering

**File**: `src/features/accounts/accountSlice.js`

#### Get Accounts (Read)
```javascript
// Admin sees ALL recruiters
// Owner sees ONLY their own recruiters (filtered by owner_id)

if (user?.role === 'owner') {
    query = query.eq('owner_id', user.id)
}
```

#### Add Account (Create)
```javascript
// Automatically add owner_id when creating recruiter
const accountWithOwner = {
    ...accountObj,
    owner_id: user.id
}
```

#### Update Account (Edit)
```javascript
// Verify ownership before allowing update
if (user?.role === 'owner') {
    // Check if recruiter belongs to this owner
    if (existing?.owner_id !== user.id) {
        throw new Error('You can only edit your own recruiters')
    }
}
```

#### Delete Account (Delete)
```javascript
// Verify ownership before allowing delete
if (user?.role === 'owner') {
    // Check if recruiter belongs to this owner
    if (existing?.owner_id !== user.id) {
        throw new Error('You can only delete your own recruiters')
    }
}
```

### 2. Auth Slice - Session Persistence

**File**: `src/features/auth/authSlice.js`

#### Check Auth
```javascript
// Update localStorage with fresh data on each check
localStorage.setItem('user', JSON.stringify(data))
```

This ensures the user data is always fresh and persisted.

### 3. App.js - Better Loading State

**File**: `src/App.js`

#### Separate Loading State
```javascript
const [isCheckingAuth, setIsCheckingAuth] = useState(true)

// Only show loading on INITIAL check
// Not on every auth state change
```

This prevents the loading spinner from showing on every render.

## How It Works Now

### Owner Login Flow
```
Owner logs in
    ↓
User data stored in localStorage
    ↓
Navigate to Accounts page
    ↓
Fetch recruiters WHERE owner_id = user.id
    ↓
Owner sees ONLY their recruiters
```

### Admin Login Flow
```
Admin logs in
    ↓
User data stored in localStorage
    ↓
Navigate to Accounts page
    ↓
Fetch ALL recruiters (no filter)
    ↓
Admin sees ALL recruiters
```

### Page Refresh Flow
```
User refreshes page
    ↓
App.js checks localStorage
    ↓
Verify user with Supabase
    ↓
Update localStorage with fresh data
    ↓
User stays logged in
    ↓
No redirect to login
```

## Testing

### Test Owner Filtering

1. **Login as Owner**
   ```
   Email: owner@test.com
   Password: owner123
   ```

2. **Add Recruiter**
   - Go to Accounts page
   - Click "Add New"
   - Create a recruiter
   - Verify it appears in the list

3. **Login as Different Owner**
   - Register a new owner account
   - Login with new account
   - Go to Accounts page
   - Verify you DON'T see the first owner's recruiters

4. **Login as Admin**
   ```
   Email: admin@system.com
   Password: admin123
   ```
   - Go to Accounts page
   - Verify you see ALL recruiters from all owners

### Test Session Persistence

1. **Login as any user**
2. **Navigate to any page**
3. **Refresh the page (F5)**
4. **Verify**:
   - ✅ Still logged in
   - ✅ No redirect to login
   - ✅ User data still in header
   - ✅ Same page displayed

5. **Navigate to different pages**
6. **Refresh on each page**
7. **Verify session persists**

### Test Ownership Protection

1. **Login as Owner**
2. **Create a recruiter**
3. **Note the recruiter ID from browser dev tools**
4. **Try to edit/delete another owner's recruiter** (if you know the ID)
5. **Verify**: Error message "You can only edit/delete your own recruiters"

## Database Schema

The `recruiters` table now uses `owner_id`:

```sql
ALTER TABLE recruiters 
ADD COLUMN IF NOT EXISTS owner_id UUID 
REFERENCES owners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recruiters_owner_id 
ON recruiters(owner_id);
```

## Security Features

### ✅ Data Isolation
- Owners can only see their own recruiters
- Owners cannot access other owners' data
- Admin can see everything

### ✅ Ownership Verification
- Edit operations verify ownership
- Delete operations verify ownership
- Cannot modify other owners' data

### ✅ Session Security
- Session validated on app load
- Disabled accounts immediately logged out
- Fresh data fetched on each check

## Edge Cases Handled

### ✅ Disabled Account
- If admin disables an owner
- Owner gets logged out on next page load
- Cannot access the system

### ✅ Deleted Account
- If admin deletes an owner
- Owner gets logged out on next page load
- Session expired error

### ✅ No Recruiters
- Owner with no recruiters sees "No recruiters found"
- Can still add new recruiters

### ✅ Network Errors
- If Supabase is down
- User stays logged in with cached data
- Error shown on operations

## Troubleshooting

### Owner sees all recruiters?
- Check `owner_id` column exists in recruiters table
- Verify recruiters have `owner_id` set
- Check user role is 'owner' not 'admin'

### Still logging out on refresh?
- Check localStorage has 'user' key
- Verify Supabase connection
- Check browser console for errors
- Clear localStorage and login again

### Cannot add recruiters?
- Check `owner_id` is being added
- Verify foreign key constraint
- Check Supabase permissions

### "You can only edit your own recruiters" error?
- You're trying to edit another owner's recruiter
- This is correct behavior
- Only edit your own recruiters

## Summary

✅ **Owner Filtering**: Each owner sees only their own recruiters
✅ **Session Persistence**: No logout on page refresh
✅ **Ownership Protection**: Cannot edit/delete other owners' data
✅ **Admin Access**: Admin sees all recruiters
✅ **Security**: Proper data isolation and verification

The system now properly isolates data by owner while maintaining admin's full access!
