# Failed Candidates & Reconnection Feature Guide

## Overview
This feature implements a comprehensive system for managing failed candidates and handling candidate reconnection when recruiters are deleted.

## Features Implemented

### 1. Failed Candidates Page
A dedicated page for viewing candidates with "failed" status, separate from the main candidates list.

**Location**: `/app/failed-candidates`

**Features**:
- View all failed candidates
- Search by name, email, or headline
- Delete failed candidates
- Owner filtering (owners see only their failed candidates)
- Admin sees all failed candidates

**Files**:
- `src/features/failedCandidates/failedCandidatesSlice.js`
- `src/features/failedCandidates/index.js`
- `src/pages/protected/FailedCandidates.js`

### 2. Candidates Page with Tabs
The candidates page now has two tabs:
- **Main**: Regular candidates (excluding failed)
- **Need Reconnection**: Candidates whose recruiter was deleted

**Tab Features**:
- Main tab: Full functionality (add, filter, search, delete)
- Need Reconnection tab: View, search, reconnect, delete
- Badge counter showing number of candidates needing reconnection

### 3. Automatic Status Change on Recruiter Deletion
When a recruiter is deleted:
- All their contacts (except failed ones) are marked as "need reconnection"
- Failed candidates remain in the Failed Candidates page
- Candidates appear in the "Need Reconnection" tab

**Implementation**: `src/features/accounts/accountSlice.js` - `deleteAccountFromDb`

### 4. Reconnect Candidates Feature
Owners can reconnect candidates to a new recruiter:
- Select a new recruiter from their team
- Choose a new status (pending, chatting, sent js, etc.)
- Updates contact record with new recruiter and status
- Moves candidate back to main candidates list

**Modal Component**: `src/features/candidates/components/ReconnectCandidateModalBody.js`

## User Workflows

### For Owners

#### Viewing Failed Candidates
1. Click "Failed Candidates" in sidebar
2. View all candidates with failed status
3. Search or delete as needed

#### When Deleting a Recruiter
1. Go to Accounts page
2. Delete a recruiter
3. System automatically marks their candidates as "need reconnection"
4. Failed candidates remain in Failed Candidates page

#### Reconnecting Candidates
1. Go to Candidates page
2. Click "Need Reconnection" tab
3. See list of candidates needing new recruiter
4. Click "Reconnect" button on a candidate
5. Select new recruiter from dropdown
6. Choose new status
7. Click "Reconnect"
8. Candidate moves back to Main tab with new recruiter

### For Admin

#### Full Visibility
- Admin sees all failed candidates across all owners
- Admin sees all candidates needing reconnection
- Admin can reconnect any candidate to any recruiter
- Admin can delete any candidate

## Database Schema Changes

### Status Values
The `contacts.status` field now includes:
- `pending`
- `chatting`
- `sent js`
- `not interested`
- `success`
- `failed` (shown in Failed Candidates page)
- `ghosted`
- `need reconnection` (shown in Need Reconnection tab)

### Contact Updates
When reconnecting:
```sql
UPDATE contacts 
SET 
  status = 'new_status',
  recruiter_id = 'new_recruiter_id',
  contacted_at = NOW()
WHERE id = 'contact_id'
```

## Redux State Structure

### Candidates Slice
```javascript
candidates: {
  candidates: [],           // Main candidates list (excludes failed)
  needReconnection: [],     // Candidates needing reconnection
  isLoading: false
}
```

### Failed Candidates Slice
```javascript
failedCandidates: {
  candidates: [],           // Failed candidates only
  isLoading: false
}
```

## API Functions

### Candidates Slice
- `getCandidatesContent()` - Fetch main candidates (excludes failed)
- `getNeedReconnectionCandidates()` - Fetch candidates with "need reconnection" status
- `updateContactStatus({ contactId, newStatus, recruiterId })` - Reconnect candidate
- `deleteCandidateFromDb(id)` - Delete candidate

### Failed Candidates Slice
- `getFailedCandidatesContent()` - Fetch failed candidates
- `deleteFailedCandidateFromDb(id)` - Delete failed candidate

### Accounts Slice
- `deleteAccountFromDb(id)` - Delete recruiter and mark contacts as "need reconnection"

## UI Components

### Sidebar Menu
```
- Dashboard
- Accounts
- Candidates
- Failed Candidates  ← NEW
- Owners (admin only)
```

### Candidates Page Tabs
```
[Main] [Need Reconnection (3)]
```

### Reconnect Modal
- Candidate name display
- Recruiter dropdown (owner's recruiters only)
- Status dropdown
- Cancel/Reconnect buttons

## Filtering Logic

### Main Candidates
- Excludes status = 'failed'
- Excludes status = 'need reconnection'
- Owner sees only their recruiters' contacts
- Admin sees all

### Need Reconnection
- Only status = 'need reconnection'
- Owner sees only their contacts
- Admin sees all

### Failed Candidates
- Only status = 'failed'
- Owner sees only their recruiters' contacts
- Admin sees all

## Files Modified/Created

### Created
1. `src/features/failedCandidates/failedCandidatesSlice.js`
2. `src/features/failedCandidates/index.js`
3. `src/pages/protected/FailedCandidates.js`
4. `src/features/candidates/components/ReconnectCandidateModalBody.js`

### Modified
1. `src/features/candidates/candidatesSlice.js`
   - Added `getNeedReconnectionCandidates()`
   - Added `updateContactStatus()`
   - Updated `getCandidatesContent()` to exclude failed
   - Added `needReconnection` state

2. `src/features/candidates/index.js`
   - Added tabs (Main, Need Reconnection)
   - Added reconnect button
   - Updated filtering logic

3. `src/features/accounts/accountSlice.js`
   - Updated `deleteAccountFromDb()` to mark contacts as "need reconnection"

4. `src/routes/sidebar.js`
   - Added Failed Candidates menu item

5. `src/routes/index.js`
   - Added Failed Candidates route

6. `src/app/store.js`
   - Added failedCandidates reducer

7. `src/utils/globalConstantUtil.js`
   - Added `CANDIDATE_RECONNECT` modal type
   - Added `FAILED_CANDIDATE_DELETE` confirmation type

8. `src/containers/ModalLayout.js`
   - Added ReconnectCandidateModalBody

9. `src/features/common/components/ConfirmationModalBody.js`
   - Added failed candidate delete handler

## Testing Checklist

- [ ] Failed candidates appear in Failed Candidates page
- [ ] Failed candidates do NOT appear in main Candidates page
- [ ] Deleting a recruiter moves their candidates to "Need Reconnection"
- [ ] Failed candidates are NOT moved when recruiter is deleted
- [ ] "Need Reconnection" tab shows correct count
- [ ] Reconnect modal loads owner's recruiters
- [ ] Reconnecting moves candidate back to Main tab
- [ ] Owner sees only their data in all pages
- [ ] Admin sees all data in all pages
- [ ] Search works in all tabs
- [ ] Delete works in all tabs

## Future Enhancements

1. Bulk reconnect multiple candidates at once
2. Auto-assign candidates to available recruiters
3. Email notifications when candidates need reconnection
4. History log of recruiter changes
5. Reconnection analytics and reports
