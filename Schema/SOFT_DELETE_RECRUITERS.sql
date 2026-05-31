-- ============================================================
-- SOFT DELETE FOR RECRUITERS
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add soft delete columns to recruiters table
ALTER TABLE recruiters
    ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_name TEXT        DEFAULT NULL;

-- Index for fast filtering of active recruiters
CREATE INDEX IF NOT EXISTS idx_recruiters_deleted_at ON recruiters(deleted_at);

-- ============================================================
-- DONE
-- Active recruiters:  WHERE deleted_at IS NULL
-- Deleted recruiters: WHERE deleted_at IS NOT NULL
-- deleted_name stores the name at time of deletion so it can
-- still be displayed in the Need Reconnection page.
-- ============================================================
