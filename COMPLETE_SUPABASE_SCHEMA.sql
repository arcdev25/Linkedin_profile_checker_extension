-- ============================================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- LinkedIn Profile Checker with Authentication
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: DROP EXISTING TABLES (if recreating from scratch)
-- ============================================================
-- Uncomment these lines if you want to completely recreate the database
-- WARNING: This will delete all data!
-- DROP TABLE IF EXISTS staging_contacts CASCADE;
-- DROP TABLE IF EXISTS highlights CASCADE;
-- DROP TABLE IF EXISTS keywords CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS recruiters CASCADE;
-- DROP TABLE IF EXISTS owners CASCADE;

-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- Owners table (users with admin or owner role)
CREATE TABLE IF NOT EXISTS owners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,  -- store bcrypt hash
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Recruiters table (your team members)
CREATE TABLE IF NOT EXISTS recruiters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  company     TEXT,
  owner_id    UUID REFERENCES owners(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- LinkedIn profiles being tracked
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_id TEXT UNIQUE NOT NULL,
  name        TEXT,
  headline    TEXT,
  profile_url TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Contact records: which recruiter contacted which profile
CREATE TABLE IF NOT EXISTS contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id  UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT,
  contacted_at  TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Highlights table: text highlights on profiles
CREATE TABLE IF NOT EXISTS highlights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id      UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  highlighted_text  TEXT NOT NULL,
  color_id          TEXT NOT NULL,
  note              TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Keywords table: owner-specific keywords with colors
CREATE TABLE IF NOT EXISTS keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  word        TEXT NOT NULL,
  color_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Staging contacts table: temporary import data
CREATE TABLE IF NOT EXISTS staging_contacts (
  date        TEXT,
  name        TEXT,
  link        TEXT,
  role        TEXT,
  status      TEXT,
  account     TEXT
);

-- ============================================================
-- STEP 3: ADD CONSTRAINTS
-- ============================================================

-- Add status check constraint for contacts
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_status_check;

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

-- ============================================================
-- STEP 4: DISABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE staging_contacts DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: CREATE INDEXES
-- ============================================================

-- Owners indexes
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_role ON owners(role);
CREATE INDEX IF NOT EXISTS idx_owners_status ON owners(status);

-- Recruiters indexes
CREATE INDEX IF NOT EXISTS idx_recruiters_owner_id ON recruiters(owner_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON recruiters(email);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_id ON profiles(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_profile_id ON contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_contacts_recruiter_id ON contacts(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_contacted_at ON contacts(contacted_at);

-- Highlights indexes
CREATE INDEX IF NOT EXISTS idx_highlights_profile_id ON highlights(profile_id);
CREATE INDEX IF NOT EXISTS idx_highlights_recruiter_id ON highlights(recruiter_id);

-- Keywords indexes
CREATE INDEX IF NOT EXISTS idx_keywords_owner_id ON keywords(owner_id);
CREATE INDEX IF NOT EXISTS idx_keywords_word ON keywords(word);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- STEP 6: CREATE TRIGGERS
-- ============================================================

-- Update trigger for owners
CREATE OR REPLACE FUNCTION update_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_owners_updated_at_trigger ON owners;
CREATE TRIGGER update_owners_updated_at_trigger
  BEFORE UPDATE ON owners
  FOR EACH ROW
  EXECUTE FUNCTION update_owners_updated_at();

-- Update trigger for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Update trigger for contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contacts_updated_at_trigger ON contacts;
CREATE TRIGGER update_contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- ============================================================
-- STEP 7: INSERT DEFAULT DATA
-- ============================================================

-- Insert default admin (password: admin123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'System Admin',
  'admin@system.com',
  '$2b$10$q7o64Tc2NMk6r4xL1Xpbcu.sZEOMZLdU8/kO7MqT04/KREU4mNwHu',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert owner accounts
-- Faker (password: Faker123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Faker',
  'Faker@owner.com',
  '$2b$10$sECRcIZAxE9rzfpWzm3ioeimIO1puayFHa8fYYasqkGZTZ8m8XgRe',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Yura (password: Yura123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Yura',
  'Yura@owner.com',
  '$2b$10$XkV0HY/KUTPAF3CRjYY0rO3C.VUB88JHwta7l3VSKJAAOTS9mRTxq',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 0xGiant (password: 0xGiant123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  '0xGiant',
  '0xGiant@owner.com',
  '$2b$10$OoiazlcEU1FTjmhjSgmtDeUJfKYkaYDQLhsE3rK3AzU170KVAIB3e',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 0xStrong (password: 0xStrong123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  '0xStrong',
  '0xStrong@owner.com',
  '$2b$10$a7GJ.YYEQ7ecZoOy0PQlbO9kVL9.7hfuC.6aXUIBXaqfj9o.w3Doi',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Voldmot (password: Voldmot123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Voldmot',
  'Voldmot@owner.com',
  '$2b$10$UovMlOb2OdUlyeH4zaegZOJB4JGXq2Ta2DsdNjORN1BTpkkLwEfda',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Rape (password: Rape123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Rape',
  'Rape@owner.com',
  '$2b$10$pa05fcUM/.PwPlQlP4wynOmNEXYZmGkSO3z3TUSF.nvOmZ9n36J1q',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STEP 8: VERIFICATION QUERIES
-- ============================================================

-- Verify all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('owners', 'recruiters', 'profiles', 'contacts', 'highlights', 'keywords', 'sessions', 'staging_contacts')
ORDER BY table_name;

-- Verify foreign key constraints
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
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('contacts', 'recruiters', 'sessions', 'highlights', 'keywords')
ORDER BY tc.table_name, kcu.column_name;

-- Verify check constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('owners', 'contacts')
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- Count records in each table
SELECT 'owners' as table_name, COUNT(*) as count FROM owners
UNION ALL
SELECT 'recruiters' as table_name, COUNT(*) as count FROM recruiters
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'contacts' as table_name, COUNT(*) as count FROM contacts
UNION ALL
SELECT 'highlights' as table_name, COUNT(*) as count FROM highlights
UNION ALL
SELECT 'keywords' as table_name, COUNT(*) as count FROM keywords
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
UNION ALL
SELECT 'staging_contacts' as table_name, COUNT(*) as count FROM staging_contacts;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================

-- You should see:
-- ✓ 8 tables created (owners, recruiters, profiles, contacts, highlights, keywords, sessions, staging_contacts)
-- ✓ Foreign keys with correct DELETE rules:
--   - contacts.recruiter_id → SET NULL (preserves contacts when recruiter deleted)
--   - contacts.profile_id → CASCADE (deletes contacts when profile deleted)
--   - highlights.recruiter_id → SET NULL
--   - highlights.profile_id → CASCADE
--   - keywords.owner_id → CASCADE
--   - recruiters.owner_id → SET NULL
--   - sessions.owner_id → CASCADE
-- ✓ Check constraints for status and role
-- ✓ All indexes created
-- ✓ 7 default users (1 admin + 6 owners)
--
-- Default Login Credentials:
-- Admin: admin@system.com / admin123
-- Owners:
--   - Faker@owner.com / Faker123
--   - Yura@owner.com / Yura123
--   - 0xGiant@owner.com / 0xGiant123
--   - 0xStrong@owner.com / 0xStrong123
--   - Voldmot@owner.com / Voldmot123
--   - Rape@owner.com / Rape123
