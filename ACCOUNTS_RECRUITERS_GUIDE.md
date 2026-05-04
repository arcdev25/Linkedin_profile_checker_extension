# Accounts (Recruiters) Feature Guide

## Overview

The Accounts page has been updated to manage Recruiters from your Supabase database with full CRUD functionality (Create, Read, Update, Delete). The status bar has been removed and the table now matches the recruiters schema.

## What Was Updated

### Files Modified

1. **src/features/accounts/accountSlice.js**
   - Added `updateAccountInDb` thunk for editing recruiters
   - Added `updateAccount` reducer
   - Removed console.log statements
   - Uses `recruiters` table from Supabase

2. **src/features/accounts/index.js**
   - Removed status badges (getDummyStatus function)
   - Removed avatar display
   - Updated table columns to match recruiters schema:
     - Name
     - Email
     - Company
     - Owner
     - Created At
   - Added Edit button with PencilIcon
   - Updated labels (Account → Recruiter)

3. **src/features/accounts/components/AddLeadModalBody.js**
   - Updated to handle both Add and Edit modes
   - Changed fields to match recruiters schema:
     - name (required)
     - email
     - company
     - owner_name
   - Removed first_name, last_name, avatar fields
   - Added edit functionality

4. **src/utils/globalConstantUtil.js**
   - Added `ACCOUNT_EDIT` modal type

5. **src/containers/ModalLayout.js**
   - Added `ACCOUNT_EDIT` modal handler

## Database Schema

### Recruiters Table
```sql
CREATE TABLE recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  company TEXT DEFAULT '',
  owner_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Features

### ✅ View Recruiters
- Displays all recruiters from Supabase
- Shows name, email, company, owner, and created date
- Clean table layout without status badges
- Loading and empty states

### ✅ Add New Recruiter
1. Click "Add New" button
2. Fill in the form:
   - **Name** (required)
   - Email
   - Company
   - Owner Name
3. Click "Save"
4. Success notification appears

### ✅ Edit Recruiter
1. Click the pencil icon on any row
2. Modal opens with current data pre-filled
3. Update any fields
4. Click "Save"
5. Success notification appears

### ✅ Delete Recruiter
1. Click the trash icon on any row
2. Confirmation modal appears
3. Click "Yes" to confirm
4. Recruiter deleted from database
5. Success notification appears

## Table Columns

| Column | Description | Source |
|--------|-------------|--------|
| Name | Recruiter's full name | `name` field |
| Email | Contact email | `email` field |
| Company | Company name | `company` field |
| Owner | Owner name | `owner_name` field |
| Created At | Date added | `created_at` field |
| Actions | Edit & Delete buttons | - |

## Changes from Previous Version

### Removed
- ❌ Status badges (Not Interested, In Progress, Sold, etc.)
- ❌ Avatar images
- ❌ First name / Last name split
- ❌ "Assigned To" column
- ❌ Console.log statements

### Added
- ✅ Edit functionality with pencil icon
- ✅ Company field
- ✅ Owner name field
- ✅ Update operation in Redux
- ✅ Edit modal support

### Updated
- ✅ Table columns match recruiters schema
- ✅ Modal title: "Add New Recruiter" / "Edit Recruiter"
- ✅ Page title: "Recruiters"
- ✅ Confirmation message: "delete this recruiter"
- ✅ Success messages: "Recruiter Added/Updated/Deleted"

## Redux State

```javascript
state.account = {
  accounts: [],      // Array of recruiter objects
  isLoading: false   // Loading state
}
```

## Usage Examples

### Adding a Recruiter
```javascript
{
  name: "John Smith",
  email: "john@company.com",
  company: "Tech Corp",
  owner_name: "Jane Doe"
}
```

### Editing a Recruiter
1. Click pencil icon
2. Modal opens with existing data
3. Change any field (e.g., update email)
4. Save updates to database

### Deleting a Recruiter
1. Click trash icon
2. Confirm deletion
3. Recruiter and all associated contacts are removed (CASCADE)

## Sample Data

Add test recruiters in Supabase SQL Editor:

```sql
INSERT INTO recruiters (name, email, company, owner_name) VALUES
  ('Sarah Johnson', 'sarah@techcorp.com', 'Tech Corp', 'John Manager'),
  ('Michael Chen', 'michael@startupco.com', 'Startup Co', 'Jane Director'),
  ('Emily Rodriguez', 'emily@bigcompany.com', 'Big Company', 'Bob Executive'),
  ('David Kim', 'david@agency.com', 'Agency Inc', 'Alice CEO');
```

## Integration with Other Tables

The recruiters table is referenced by the contacts table:

```sql
-- Contacts reference recruiters
CREATE TABLE contacts (
  ...
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,
  ...
);
```

When a recruiter is deleted, all their contacts are automatically removed (CASCADE).

## UI Components

### Action Buttons
- **Add New** (Primary button, top right)
- **Edit** (Pencil icon, each row)
- **Delete** (Trash icon, each row)

### Modals
- **Add Recruiter Modal** - Empty form
- **Edit Recruiter Modal** - Pre-filled form
- **Confirmation Modal** - Delete confirmation

### States
- **Loading** - "Loading..." message
- **Empty** - "No recruiters found" message
- **Error** - Error message in modal

## Validation

### Required Fields
- **Name** - Must not be empty

### Optional Fields
- Email
- Company
- Owner Name

## Error Handling

### Add/Edit Errors
- Name validation
- Supabase connection errors
- Duplicate email errors (if unique constraint added)

### Delete Errors
- Foreign key constraint errors
- Supabase connection errors

## Troubleshooting

### No recruiters showing
- Check Supabase connection
- Verify recruiters table has data
- Check browser console for errors

### Can't add recruiter
- Ensure name field is filled
- Check Supabase credentials
- Verify table permissions

### Can't edit recruiter
- Check that recruiter ID exists
- Verify Supabase connection
- Check for validation errors

### Can't delete recruiter
- Check for foreign key constraints
- Verify RLS policies allow deletion
- Check associated contacts

## Next Steps

### Potential Enhancements
1. **Search** - Add search by name/email
2. **Filter** - Filter by company or owner
3. **Sort** - Sort by any column
4. **Pagination** - Handle large datasets
5. **Bulk Actions** - Select multiple recruiters
6. **Export** - Export to CSV
7. **Import** - Import from CSV
8. **Avatar Upload** - Add profile pictures
9. **Contact Count** - Show number of contacts per recruiter
10. **Performance Stats** - Show success rate per recruiter

### Integration Ideas
1. **Dashboard** - Already integrated (shows recruiter performance)
2. **Candidates** - Link to candidates contacted by each recruiter
3. **Email** - Send emails directly from recruiter profile
4. **Calendar** - View recruiter's schedule
5. **Reports** - Generate recruiter performance reports

## Summary

The Accounts page now:
- ✅ Manages recruiters from Supabase
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Clean table without status badges
- ✅ Matches recruiters schema exactly
- ✅ Edit functionality with modal
- ✅ Proper validation and error handling
- ✅ Success notifications for all operations

Navigate to `/app/accounts` to manage your recruitment team!
