# Candidates Filtering by Owner

## Issue Fixed

**Problem**: All users could see all candidates regardless of who contacted them.

**Solution**: Filter candidates based on the logged-in user's role and their recruiters' contacts.

## How It Works Now

### Admin View
```
Admin logs in
    ↓
Sees ALL profiles
    ↓
With ALL contacts from ALL recruiters
```

### Owner View
```
Owner logs in
    ↓
Get owner's recruiters
    ↓
Get contacts made by those recruiters
    ↓
Show ONLY profiles contacted by owner's recruiters
```

## Data Flow

### For Owners
```sql
1. Get recruiters WHERE owner_id = current_user.id
2. Get contacts WHERE recruiter_id IN (owner's recruiters)
3. Get profiles FROM those contacts
4. Show only those profiles
```

### For Admins
```sql
1. Get ALL profiles
2. Get ALL contacts
3. Show everything
```

## Implementation Details

### Get Candidates Logic

```javascript
if (user?.role === 'admin') {
    // Admin: Fetch all profiles with all contacts
    SELECT profiles.*, contacts.* 
    FROM profiles
    LEFT JOIN contacts ON profiles.id = contacts.profile_id
}
else {
    // Owner: Fetch only contacted profiles
    
    // Step 1: Get owner's recruiters
    SELECT id FROM recruiters 
    WHERE owner_id = user.id
    
    // Step 2: Get contacts by those recruiters
    SELECT * FROM contacts 
    WHERE recruiter_id IN (recruiter_ids)
    
    // Step 3: Return profiles from those contacts
    // Grouped by profile_id, showing latest contact
}
```

### Delete Candidate Logic

```javascript
if (user?.role === 'owner') {
    // Verify owner's recruiters contacted this candidate
    
    // Get owner's recruiters
    SELECT id FROM recruiters WHERE owner_id = user.id
    
    // Check if any contacted this profile
    SELECT id FROM contacts 
    WHERE profile_id = candidate_id 
    AND recruiter_id IN (recruiter_ids)
    
    // If no contacts found, throw error
    if (no contacts) {
        throw 'You can only delete candidates you have contacted'
    }
}

// Proceed with delete
DELETE FROM profiles WHERE id = candidate_id
```

## Database Relationships

```
owners (1) ──→ (many) recruiters
                    ↓
                    (many) contacts
                            ↓
                            (many) profiles
```

### Query Path for Owners
```
Current Owner
    ↓
Owner's Recruiters
    ↓
Recruiters' Contacts
    ↓
Contacted Profiles (Candidates)
```

## Edge Cases Handled

### ✅ Owner with No Recruiters
- Returns empty array
- Shows "No candidates found"
- Can still add candidates (but won't see them until a recruiter contacts them)

### ✅ Owner with Recruiters but No Contacts
- Returns empty array
- Shows "No candidates found"
- Recruiters need to make contacts first

### ✅ Multiple Contacts per Profile
- Shows latest contact
- Groups by profile_id
- Sorts by contacted_at descending

### ✅ Admin Access
- Sees all profiles
- Sees all contacts
- No filtering applied

## Testing

### Test Owner Filtering

1. **Setup**
   ```sql
   -- Create Owner 1
   INSERT INTO owners (name, email, password, role) 
   VALUES ('Owner One', 'owner1@test.com', 'hash', 'owner');
   
   -- Create Owner 2
   INSERT INTO owners (name, email, password, role) 
   VALUES ('Owner Two', 'owner2@test.com', 'hash', 'owner');
   
   -- Create Recruiter for Owner 1
   INSERT INTO recruiters (name, email, owner_id) 
   VALUES ('Recruiter A', 'ra@test.com', owner1_id);
   
   -- Create Recruiter for Owner 2
   INSERT INTO recruiters (name, email, owner_id) 
   VALUES ('Recruiter B', 'rb@test.com', owner2_id);
   
   -- Create Profiles
   INSERT INTO profiles (linkedin_id, name) 
   VALUES ('candidate-1', 'Candidate One');
   
   INSERT INTO profiles (linkedin_id, name) 
   VALUES ('candidate-2', 'Candidate Two');
   
   -- Recruiter A contacts Candidate 1
   INSERT INTO contacts (profile_id, recruiter_id, status) 
   VALUES (candidate1_id, recruiterA_id, 'pending');
   
   -- Recruiter B contacts Candidate 2
   INSERT INTO contacts (profile_id, recruiter_id, status) 
   VALUES (candidate2_id, recruiterB_id, 'chatting');
   ```

2. **Test Owner 1**
   - Login as Owner 1
   - Go to Candidates page
   - Should see ONLY Candidate 1 ✅
   - Should NOT see Candidate 2 ✅

3. **Test Owner 2**
   - Login as Owner 2
   - Go to Candidates page
   - Should see ONLY Candidate 2 ✅
   - Should NOT see Candidate 1 ✅

4. **Test Admin**
   - Login as Admin
   - Go to Candidates page
   - Should see BOTH Candidate 1 and Candidate 2 ✅

### Test Delete Protection

1. **Login as Owner 1**
2. **Try to delete Candidate 2** (contacted by Owner 2's recruiter)
3. **Verify**: Error "You can only delete candidates you have contacted" ✅

## Security Features

### ✅ Data Isolation
- Owners see only candidates contacted by their recruiters
- Cannot see other owners' candidates
- Admin sees everything

### ✅ Delete Protection
- Owners can only delete candidates they contacted
- Verification checks recruiter ownership
- Admin can delete any candidate

### ✅ Query Optimization
- Uses IN clause for recruiter filtering
- Indexes on recruiter_id and owner_id
- Efficient joins

## Performance Considerations

### Indexes Required
```sql
-- Already created in schema
CREATE INDEX idx_recruiters_owner_id ON recruiters(owner_id);
CREATE INDEX idx_contacts_recruiter_id ON contacts(recruiter_id);
CREATE INDEX idx_contacts_profile_id ON contacts(profile_id);
```

### Query Optimization
- Uses `IN` clause instead of multiple queries
- Groups contacts by profile_id in application
- Sorts once after grouping

## Comparison: Before vs After

### Before
| User | Candidates Visible |
|------|-------------------|
| Admin | All candidates |
| Owner 1 | All candidates ❌ |
| Owner 2 | All candidates ❌ |

### After
| User | Candidates Visible |
|------|-------------------|
| Admin | All candidates ✅ |
| Owner 1 | Only contacted by Owner 1's recruiters ✅ |
| Owner 2 | Only contacted by Owner 2's recruiters ✅ |

## Troubleshooting

### Owner sees no candidates?
- Check if owner has recruiters
- Check if recruiters have made contacts
- Verify contacts table has data
- Check recruiter owner_id matches

### Owner sees all candidates?
- Check user role is 'owner' not 'admin'
- Verify filtering logic is applied
- Check Redux state has correct user

### Cannot delete candidate?
- You're trying to delete another owner's candidate
- This is correct behavior
- Only delete candidates you contacted

### Admin sees no candidates?
- Check profiles table has data
- Verify Supabase connection
- Check browser console for errors

## Summary

✅ **Owner Filtering**: Each owner sees only candidates contacted by their recruiters
✅ **Admin Access**: Admin sees all candidates
✅ **Delete Protection**: Cannot delete other owners' candidates
✅ **Data Isolation**: Proper separation by owner
✅ **Performance**: Optimized queries with indexes

The candidates page now properly filters by owner while maintaining admin's full access!
