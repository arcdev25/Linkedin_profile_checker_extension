# Candidates Feature Guide

## Overview

The Candidates page replaces the Transactions page and displays LinkedIn profiles from your Supabase database with full CRUD functionality, search, and filtering capabilities.

## What Was Implemented

### Files Created

1. **src/features/candidates/candidatesSlice.js** - Redux slice with Supabase integration
2. **src/features/candidates/index.js** - Main candidates table component
3. **src/features/candidates/components/AddCandidateModalBody.js** - Add candidate modal
4. **src/pages/protected/Candidates.js** - Page wrapper

### Files Modified

1. **src/routes/index.js** - Replaced Transactions with Candidates route
2. **src/routes/sidebar.js** - Updated sidebar menu (Transactions → Candidates)
3. **src/app/store.js** - Added candidates reducer
4. **src/containers/ModalLayout.js** - Added candidate modal support
5. **src/features/common/components/ConfirmationModalBody.js** - Added candidate deletion
6. **src/utils/globalConstantUtil.js** - Added candidate modal types

## Features

### ✅ View Candidates
- Displays all LinkedIn profiles from Supabase
- Shows profile picture, name, headline, status, recruiter, and last contact date
- Clickable LinkedIn profile links
- Loading states and empty states

### ✅ Search Functionality
- Search by name, email, or headline
- Real-time filtering as you type
- Clear search to reset

### ✅ Filter by Status
- Filter candidates by contact status:
  - pending
  - chatting
  - sent js
  - not interested
  - success
  - failed
  - ghosted
  - not contacted
- Visual filter indicator
- Easy filter removal

### ✅ Add New Candidate
- Click "Add New" button
- Fill in candidate details:
  - LinkedIn ID (required)
  - Full Name (required)
  - Headline
  - Profile URL
  - Avatar URL
- Data saved to Supabase profiles table
- Success notification

### ✅ Delete Candidate
- Click trash icon
- Confirmation modal
- Deletes from Supabase
- Cascading delete removes associated contacts

### ✅ Status Badges
Color-coded status badges:
- **Pending** - Yellow/Warning
- **Chatting** - Blue/Info
- **Sent JS** - Primary
- **Not Interested** - Red/Error
- **Success** - Green/Success
- **Failed** - Red/Error
- **Ghosted** - Gray/Ghost
- **Not Contacted** - Gray/Ghost

## Data Structure

### Profiles Table (Candidates)
```javascript
{
  id: UUID,                    // Auto-generated
  linkedin_id: string,         // Required, unique
  name: string,                // Candidate name
  headline: string,            // LinkedIn headline
  profile_url: string,         // LinkedIn URL
  avatar_url: string,          // Profile picture URL
  created_at: timestamp,       // Auto-generated
  updated_at: timestamp        // Auto-updated
}
```

### Joined with Contacts
The candidates view automatically joins with the contacts table to show:
- Latest contact status
- Assigned recruiter name
- Last contact date
- Contact notes

## Redux State

```javascript
state.candidates = {
  candidates: [],    // Array of candidate objects with contact info
  isLoading: false   // Loading state
}
```

## Usage

### Viewing Candidates
1. Click "Candidates" in the sidebar
2. All LinkedIn profiles load automatically
3. View candidate details in the table

### Searching
1. Type in the search bar
2. Results filter in real-time
3. Clear search to see all candidates

### Filtering by Status
1. Click the "Filter" dropdown
2. Select a status
3. Table shows only matching candidates
4. Click "Remove Filter" to reset

### Adding a Candidate
1. Click "Add New" button
2. Fill in the form:
   - LinkedIn ID: e.g., "john-doe-123"
   - Name: Full name
   - Headline: Job title/description
   - Profile URL: Full LinkedIn URL
   - Avatar URL: Profile picture (optional)
3. Click "Save"

### Deleting a Candidate
1. Click trash icon on any row
2. Confirm deletion
3. Candidate removed from database

## Integration with Contacts

The candidates feature intelligently joins with the contacts table to show:

```sql
SELECT profiles.*, 
       contacts.status,
       contacts.contacted_at,
       recruiters.name as recruiter_name
FROM profiles
LEFT JOIN contacts ON profiles.id = contacts.profile_id
LEFT JOIN recruiters ON contacts.recruiter_id = recruiters.id
```

This provides a complete view of each candidate's recruitment status.

## Navigation

**Sidebar Menu:**
- Dashboard
- Accounts
- **Candidates** ← New!
- Analytics
- Pages
- Settings

**URL:** `/app/candidates`

## Sample Data

To add test candidates, run this in Supabase SQL Editor:

```sql
INSERT INTO profiles (linkedin_id, name, headline, profile_url, avatar_url) VALUES
  ('john-smith-123', 'John Smith', 'Senior Software Engineer', 'https://linkedin.com/in/john-smith-123', 'https://i.pravatar.cc/150?img=1'),
  ('jane-doe-456', 'Jane Doe', 'Product Manager', 'https://linkedin.com/in/jane-doe-456', 'https://i.pravatar.cc/150?img=2'),
  ('alex-wilson-789', 'Alex Wilson', 'Full Stack Developer', 'https://linkedin.com/in/alex-wilson-789', 'https://i.pravatar.cc/150?img=3');
```

## Troubleshooting

### No candidates showing
- Check that profiles table has data
- Verify Supabase credentials in `.env`
- Check browser console for errors

### Search not working
- Ensure search is typing in the search bar
- Check that candidate data has name/headline fields
- Clear any active filters

### Can't add candidates
- Verify linkedin_id is unique
- Check required fields are filled
- Ensure Supabase connection is active

### Delete not working
- Check RLS policies allow deletion
- Verify candidate ID exists
- Check for foreign key constraints

## Differences from Transactions

| Feature | Transactions | Candidates |
|---------|-------------|------------|
| Data Source | Dummy data | Supabase |
| Add New | ❌ No | ✅ Yes |
| Delete | ❌ No | ✅ Yes |
| Search | ✅ Yes | ✅ Yes |
| Filter | ✅ Location | ✅ Status |
| Real-time | ❌ No | ✅ Yes |
| Database | ❌ None | ✅ Supabase |

## Next Steps

### Potential Enhancements
1. **Edit Candidate** - Update candidate information
2. **Bulk Actions** - Select multiple candidates for bulk operations
3. **Export** - Export candidates to CSV
4. **Import** - Import candidates from LinkedIn CSV
5. **Advanced Filters** - Filter by recruiter, date range, etc.
6. **Candidate Details** - Click row to see full candidate profile
7. **Contact History** - View all contacts for a candidate
8. **Notes** - Add notes to candidates
9. **Tags** - Tag candidates with skills, interests, etc.
10. **Pagination** - Handle large datasets efficiently

### Integration Ideas
1. **LinkedIn API** - Auto-import profiles
2. **Email Integration** - Send emails directly from the app
3. **Calendar Integration** - Schedule interviews
4. **Chrome Extension** - Add candidates while browsing LinkedIn
5. **Real-time Updates** - Use Supabase subscriptions for live updates

## Summary

The Candidates page is now fully functional with:
- ✅ Supabase integration
- ✅ Search and filter capabilities
- ✅ Add/Delete operations
- ✅ Status tracking
- ✅ Recruiter assignment visibility
- ✅ Clean, responsive UI

Navigate to `/app/candidates` to start managing your LinkedIn recruitment pipeline!
