-- Add country column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.country IS 'Country/location of the profile';

-- Optional: Create an index if you plan to filter by country frequently
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
