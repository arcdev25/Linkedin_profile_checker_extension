-- ============================================================
-- ADD OWNER_ID TO CONTACTS TABLE
-- This allows tracking ownership even after recruiter is deleted
-- ============================================================

-- Step 1: Add owner_id column to contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;

-- Step 2: Populate owner_id from existing recruiters
UPDATE contacts c
SET owner_id = r.owner_id
FROM recruiters r
WHERE c.recruiter_id = r.id
  AND c.owner_id IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);

-- Step 4: Verify the update
SELECT 
  COUNT(*) as total_contacts,
  COUNT(owner_id) as contacts_with_owner,
  COUNT(*) - COUNT(owner_id) as contacts_without_owner
FROM contacts;

-- Expected: Most contacts should have owner_id populated

-- ============================================================
-- DONE! Now contacts will retain owner_id even after recruiter deletion
-- ============================================================
