-- ============================================================
-- Authentication & Authorization Schema
-- Run this in your Supabase SQL Editor
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

ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_role ON owners(role);
CREATE INDEX IF NOT EXISTS idx_owners_status ON owners(status);

-- Update trigger for owners
CREATE OR REPLACE FUNCTION update_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_owners_updated_at_trigger
  BEFORE UPDATE ON owners
  FOR EACH ROW
  EXECUTE FUNCTION update_owners_updated_at();

-- Insert default admin (password: admin123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'System Admin',
  'admin@system.com',
  '$2b$10$q7o64Tc2NMk6r4xL1Xpbcu.sZEOMZLdU8/kO7MqT04/KREU4mNwHu',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert test owner (password: owner123)
INSERT INTO owners (name, email, password, role, status) 
VALUES (
  'Test Owner',
  'owner@test.com',
  '$2b$10$SoMxcmpH3LTjJ3SAhg1rkOAqEu0dHbpBbyqTNW.aBmNS0DT27trAO',
  'owner',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Sessions table for managing user sessions (optional, for future use)
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions(owner_id);

-- Update recruiters table to link with owners
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_recruiters_owner_id ON recruiters(owner_id);
