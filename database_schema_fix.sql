-- ============================================================
-- Database Schema Fix for Recruiter Deletion
-- This ensures contacts are NOT deleted when a recruiter is deleted
-- ============================================================

-- STEP 1: Clean up any invalid status values first
-- This prevents "check constraint violated" errors
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

-- STEP 2: Drop the existing constraints
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_recruiter_id_fkey;

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

-- STEP 4: Recreate the foreign key with SET NULL instead of CASCADE
-- This way, when a recruiter is deleted, the recruiter_id becomes NULL
-- but the contact record is preserved
ALTER TABLE contacts 
ADD CONSTRAINT contacts_recruiter_id_fkey 
FOREIGN KEY (recruiter_id) 
REFERENCES recruiters(id) 
ON DELETE SET NULL;

-- STEP 5: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- STEP 6: Verify the changes
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'contacts'
  AND kcu.column_name = 'recruiter_id';

-- This should show: delete_rule = 'SET NULL'

-- STEP 7: Show current status distribution
SELECT 
  status,
  COUNT(*) as count
FROM contacts
GROUP BY status
ORDER BY count DESC;
