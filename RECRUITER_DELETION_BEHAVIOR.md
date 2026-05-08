# Recruiter Deletion Behavior - Complete Guide

## Current Implementation

### What Happens When You Delete a Recruiter?

The system is designed to **PRESERVE all candidates** - they are NOT deleted from the database.

### Step-by-Step Process:

1. **User clicks delete on a recruiter** in the Accounts page
2. **System checks all contacts** for that recruiter
3. **For each contact:**
   - If status = "failed" → **Keep as "failed"** (no change)
   - If status = anything else → **Change to "need reconnection"**
4. **Recruiter is deleted** from the recruiters table
5. **All contact records remain** in the contacts table

### Result:

- ✅ **Candidates are preserved** - no data loss
- ✅ **Failed candidates** stay in Failed Candidates page
- ✅ **Other candidates** move to Need Reconnection tab
- ✅ **You can reconnect** candidates to a new recruiter

## Code Implementation

### Location: `src/features/accounts/accountSlice.js`

```javascript
export const deleteAccountFromDb = createAsyncThunk('/accounts/delete', async (id, { getState }) => {
    // ... ownership verification ...

    // Step 1: Update contacts to "need reconnection" (except failed)
    const { error: updateError } = await supabase
        .from('contacts')
        .update({ status: 'need reconnection' })
        .eq('recruiter_id', id)
        .neq('status', 'failed') // Don't change failed candidates
    
    if (updateError) throw updateError

    // Step 2: Delete the recruiter
    const { error } = await supabase
        .from('recruiters')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return id
})
```

## Database Schema Requirement

### ⚠️ CRITICAL: Foreign Key Constraint

Your database MUST have the correct foreign key constraint:

```sql
ALTER TABLE contacts 
ADD CONSTRAINT contacts_recruiter_id_fkey 
FOREIGN KEY (recruiter_id) 
REFERENCES recruiters(id) 
ON DELETE SET NULL;  -- This is crucial!
```

### Why This Matters:

- ❌ **ON DELETE CASCADE** → Deletes all contacts when recruiter is deleted (BAD!)
- ✅ **ON DELETE SET NULL** → Sets recruiter_id to NULL, preserves contacts (GOOD!)

### How to Fix:

Run the `database_schema_fix.sql` file in your Supabase SQL Editor:

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Open database_schema_fix.sql
# 3. Click "Run"
```

## User Workflows

### Scenario 1: Delete Recruiter with Regular Candidates

**Before Deletion:**
- Recruiter: "John Doe"
- Candidates: 
  - Alice (status: "chatting")
  - Bob (status: "pending")
  - Carol (status: "success")

**After Deletion:**
- Recruiter: ❌ Deleted
- Candidates in "Need Reconnection" tab:
  - Alice (status: "need reconnection")
  - Bob (status: "need reconnection")
  - Carol (status: "need reconnection")

**Next Steps:**
1. Go to Candidates page
2. Click "Need Reconnection" tab
3. Click "Reconnect" on each candidate
4. Select new recruiter
5. Candidates move back to Main tab

### Scenario 2: Delete Recruiter with Failed Candidates

**Before Deletion:**
- Recruiter: "Jane Smith"
- Candidates:
  - David (status: "failed")
  - Emma (status: "chatting")

**After Deletion:**
- Recruiter: ❌ Deleted
- David → Stays in "Failed Candidates" page (status: "failed")
- Emma → Moves to "Need Reconnection" tab (status: "need reconnection")

### Scenario 3: Delete Recruiter with Mixed Candidates

**Before Deletion:**
- Recruiter: "Mike Johnson"
- Candidates:
  - Frank (status: "failed")
  - Grace (status: "failed")
  - Henry (status: "success")
  - Iris (status: "pending")

**After Deletion:**
- Failed Candidates page:
  - Frank (status: "failed")
  - Grace (status: "failed")
- Need Reconnection tab:
  - Henry (status: "need reconnection")
  - Iris (status: "need reconnection")

## Verification

### How to Verify It's Working:

1. **Create a test recruiter** with some candidates
2. **Mark one candidate as "failed"**
3. **Delete the recruiter**
4. **Check:**
   - ✅ Failed candidate is in "Failed Candidates" page
   - ✅ Other candidates are in "Need Reconnection" tab
   - ✅ No candidates were deleted from database

### SQL Query to Check:

```sql
-- Check contacts after recruiter deletion
SELECT 
  p.name as candidate_name,
  c.status,
  c.recruiter_id,
  CASE 
    WHEN c.recruiter_id IS NULL THEN 'Recruiter Deleted'
    ELSE 'Recruiter Active'
  END as recruiter_status
FROM contacts c
JOIN profiles p ON c.profile_id = p.id
WHERE c.status IN ('failed', 'need reconnection')
ORDER BY c.status, p.name;
```

## Troubleshooting

### Problem: Candidates are being deleted when I delete a recruiter

**Cause:** Your database has `ON DELETE CASCADE` instead of `ON DELETE SET NULL`

**Solution:** Run `database_schema_fix.sql`

### Problem: Failed candidates are moving to "Need Reconnection" tab

**Cause:** The status filter in the code is not working

**Solution:** Check that line 90 in `accountSlice.js` has `.neq('status', 'failed')`

### Problem: Candidates are not appearing in "Need Reconnection" tab

**Cause:** The status is not being updated to "need reconnection"

**Solution:** 
1. Check that the update query is running (line 87-90 in `accountSlice.js`)
2. Verify the "need reconnection" status is in your database CHECK constraint

## Summary

✅ **Candidates are NEVER deleted** when you delete a recruiter
✅ **Failed candidates stay failed** and remain in Failed Candidates page
✅ **Other candidates move to Need Reconnection** tab for reassignment
✅ **You can reconnect candidates** to a new recruiter anytime
✅ **No data loss** - all contact history is preserved

This design ensures you never lose valuable candidate data when managing your recruiting team!
