-- ============================================================
-- MIGRATION: Add "need reconnection" Status
-- Use this if you already have an existing database with data
-- ============================================================

-- STEP 1: Update any invalid statuses to 'pending'
-- This prevents constraint violation errors
UPDATE contacts 
SET status = 'pending' 
WHERE status NOT IN (
  'pending',
  'chatting',
  'sent js',
  'not interested',
  'success',
  'failed',
  'ghosted',
  'need reconnection'
);

-- STEP 2: Drop the old status check constraint
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_status_check;

-- STEP 3: Add new status check constraint with "need reconnection"
ALTER TABLE contacts 
ADD CONSTRAINT contacts_status_check 
CHECK (status IN (
  'pending',
  'chatting',
  'sent js',
  'not interested',
  'success',
  'failed',
  'ghosted',
  'need reconnection'
));

-- STEP 4: Fix foreign key constraint for recruiter_id
-- Drop old constraint
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_recruiter_id_fkey;

-- Add new constraint with SET NULL (preserves contacts when recruiter deleted)
ALTER TABLE contacts 
ADD CONSTRAINT contacts_recruiter_id_fkey 
FOREIGN KEY (recruiter_id) 
REFERENCES recruiters(id) 
ON DELETE SET NULL;

-- STEP 5: Add index for status (improves query performance)
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- STEP 6: Verify the changes
SELECT 
  'Status Check Constraint' as check_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contacts'
  AND tc.constraint_name = 'contacts_status_check';

SELECT 
  'Foreign Key Constraint' as constraint_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'contacts'
  AND kcu.column_name = 'recruiter_id';

-- STEP 7: Show current status distribution
SELECT 
  status,
  COUNT(*) as count
FROM contacts
GROUP BY status
ORDER BY count DESC;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Expected results:
-- ✓ Status constraint includes "need reconnection"
-- ✓ Foreign key delete_rule = "SET NULL"
-- ✓ All existing data preserved
