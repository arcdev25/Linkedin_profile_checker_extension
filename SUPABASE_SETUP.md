# Supabase Setup for Accounts Feature

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- A Supabase project created

## Database Setup

### 1. Create the Accounts Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create accounts table
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all operations for authenticated users" ON accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX idx_accounts_email ON accounts(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configure Environment Variables

1. Copy `.env.template` to `.env`:
   ```bash
   copy .env.template .env
   ```

2. Get your Supabase credentials:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. Update your `.env` file:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to the Accounts page
3. Try adding a new account
4. Verify the data appears in your Supabase dashboard

## Features Implemented

- ✅ Fetch accounts from Supabase
- ✅ Add new accounts to Supabase
- ✅ Delete accounts from Supabase
- ✅ Real-time data synchronization
- ✅ Loading states
- ✅ Error handling

## Security Notes

The current setup uses a permissive RLS policy that allows all operations. For production:

1. Implement proper authentication
2. Update RLS policies to restrict access based on user roles
3. Add validation rules
4. Consider adding audit logging

Example of a more restrictive policy:
```sql
-- Only allow authenticated users to read/write their own data
CREATE POLICY "Users can manage their own accounts" ON accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
