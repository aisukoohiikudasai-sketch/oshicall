-- Add influencer_application_status column to users table
-- This tracks whether a user wants to be an influencer and their approval status

ALTER TABLE users
ADD COLUMN IF NOT EXISTS influencer_application_status TEXT DEFAULT 'none'
CHECK (influencer_application_status IN ('none', 'pending', 'approved', 'rejected'));

-- Add comment
COMMENT ON COLUMN users.influencer_application_status IS
'Tracks influencer application status: none (not applied), pending (under review), approved (can create talks), rejected (denied)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_influencer_application_status
ON users(influencer_application_status);
