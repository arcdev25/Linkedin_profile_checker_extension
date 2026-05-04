-- Sample Data for LinkedIn Profile Checker Dashboard
-- Run this in your Supabase SQL Editor to populate test data

-- Insert sample recruiters
INSERT INTO recruiters (name, email) VALUES
  ('Sarah Johnson', 'sarah.johnson@company.com'),
  ('Michael Chen', 'michael.chen@company.com'),
  ('Emily Rodriguez', 'emily.rodriguez@company.com'),
  ('David Kim', 'david.kim@company.com');

-- Insert sample LinkedIn profiles
INSERT INTO profiles (linkedin_id, name, headline, profile_url, avatar_url) VALUES
  ('john-smith-123', 'John Smith', 'Senior Software Engineer at Tech Corp', 'https://linkedin.com/in/john-smith-123', 'https://i.pravatar.cc/150?img=1'),
  ('jane-doe-456', 'Jane Doe', 'Product Manager | SaaS Expert', 'https://linkedin.com/in/jane-doe-456', 'https://i.pravatar.cc/150?img=2'),
  ('alex-wilson-789', 'Alex Wilson', 'Full Stack Developer', 'https://linkedin.com/in/alex-wilson-789', 'https://i.pravatar.cc/150?img=3'),
  ('maria-garcia-321', 'Maria Garcia', 'UX Designer | Creative Problem Solver', 'https://linkedin.com/in/maria-garcia-321', 'https://i.pravatar.cc/150?img=4'),
  ('robert-brown-654', 'Robert Brown', 'DevOps Engineer', 'https://linkedin.com/in/robert-brown-654', 'https://i.pravatar.cc/150?img=5'),
  ('lisa-anderson-987', 'Lisa Anderson', 'Data Scientist | ML Enthusiast', 'https://linkedin.com/in/lisa-anderson-987', 'https://i.pravatar.cc/150?img=6'),
  ('james-taylor-147', 'James Taylor', 'Frontend Developer | React Specialist', 'https://linkedin.com/in/james-taylor-147', 'https://i.pravatar.cc/150?img=7'),
  ('sophia-martinez-258', 'Sophia Martinez', 'Backend Engineer | Python Expert', 'https://linkedin.com/in/sophia-martinez-258', 'https://i.pravatar.cc/150?img=8'),
  ('william-lee-369', 'William Lee', 'Mobile Developer | iOS & Android', 'https://linkedin.com/in/william-lee-369', 'https://i.pravatar.cc/150?img=9'),
  ('olivia-white-741', 'Olivia White', 'QA Engineer | Automation Specialist', 'https://linkedin.com/in/olivia-white-741', 'https://i.pravatar.cc/150?img=10'),
  ('daniel-harris-852', 'Daniel Harris', 'Cloud Architect | AWS Certified', 'https://linkedin.com/in/daniel-harris-852', 'https://i.pravatar.cc/150?img=11'),
  ('emma-clark-963', 'Emma Clark', 'Security Engineer | Cybersecurity', 'https://linkedin.com/in/emma-clark-963', 'https://i.pravatar.cc/150?img=12'),
  ('noah-lewis-159', 'Noah Lewis', 'Tech Lead | Team Builder', 'https://linkedin.com/in/noah-lewis-159', 'https://i.pravatar.cc/150?img=13'),
  ('ava-walker-357', 'Ava Walker', 'Scrum Master | Agile Coach', 'https://linkedin.com/in/ava-walker-357', 'https://i.pravatar.cc/150?img=14'),
  ('ethan-hall-486', 'Ethan Hall', 'Solutions Architect', 'https://linkedin.com/in/ethan-hall-486', 'https://i.pravatar.cc/150?img=15');

-- Insert sample contacts with various statuses
-- Note: You'll need to replace the recruiter_id and profile_id with actual UUIDs from your tables
-- This is a template - run the SELECT queries first to get the IDs

-- Get recruiter IDs
-- SELECT id, name FROM recruiters;

-- Get profile IDs
-- SELECT id, name FROM profiles;

-- Example contacts (replace UUIDs with actual values)
-- INSERT INTO contacts (profile_id, recruiter_id, status, notes, contacted_at) VALUES
--   ((SELECT id FROM profiles WHERE linkedin_id = 'john-smith-123'), (SELECT id FROM recruiters WHERE name = 'Sarah Johnson'), 'success', 'Great conversation, hired!', NOW() - INTERVAL '1 day'),
--   ((SELECT id FROM profiles WHERE linkedin_id = 'jane-doe-456'), (SELECT id FROM recruiters WHERE name = 'Michael Chen'), 'chatting', 'Discussing role details', NOW() - INTERVAL '2 days'),
--   ((SELECT id FROM profiles WHERE linkedin_id = 'alex-wilson-789'), (SELECT id FROM recruiters WHERE name = 'Emily Rodriguez'), 'pending', 'Sent initial message', NOW() - INTERVAL '3 days');

-- Better approach: Use a DO block to insert contacts with proper references
DO $$
DECLARE
  recruiter_ids UUID[];
  profile_ids UUID[];
  statuses TEXT[] := ARRAY['pending', 'chatting', 'sent js', 'not interested', 'success', 'failed', 'ghosted'];
  i INT;
BEGIN
  -- Get all recruiter IDs
  SELECT ARRAY_AGG(id) INTO recruiter_ids FROM recruiters;
  
  -- Get all profile IDs
  SELECT ARRAY_AGG(id) INTO profile_ids FROM profiles;
  
  -- Insert contacts with random assignments
  FOR i IN 1..ARRAY_LENGTH(profile_ids, 1) LOOP
    INSERT INTO contacts (profile_id, recruiter_id, status, notes, contacted_at)
    VALUES (
      profile_ids[i],
      recruiter_ids[1 + (i % ARRAY_LENGTH(recruiter_ids, 1))],
      statuses[1 + (i % ARRAY_LENGTH(statuses, 1))],
      CASE 
        WHEN i % 7 = 0 THEN 'Great conversation, very interested'
        WHEN i % 7 = 1 THEN 'Sent initial message'
        WHEN i % 7 = 2 THEN 'Follow-up scheduled'
        WHEN i % 7 = 3 THEN 'Not a good fit'
        WHEN i % 7 = 4 THEN 'Discussing compensation'
        WHEN i % 7 = 5 THEN 'No response yet'
        ELSE 'Initial contact made'
      END,
      NOW() - (INTERVAL '1 day' * (i % 7))
    );
  END LOOP;
END $$;

-- Verify the data
SELECT 
  'Recruiters' as table_name, 
  COUNT(*) as count 
FROM recruiters
UNION ALL
SELECT 
  'Profiles' as table_name, 
  COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
  'Contacts' as table_name, 
  COUNT(*) as count 
FROM contacts;

-- View contact status distribution
SELECT 
  status, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM contacts
GROUP BY status
ORDER BY count DESC;

-- View recruiter performance
SELECT 
  r.name as recruiter,
  COUNT(c.id) as total_contacts,
  COUNT(CASE WHEN c.status = 'success' THEN 1 END) as successes,
  ROUND(
    COUNT(CASE WHEN c.status = 'success' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(c.id), 0), 
    2
  ) as conversion_rate
FROM recruiters r
LEFT JOIN contacts c ON r.id = c.recruiter_id
GROUP BY r.id, r.name
ORDER BY conversion_rate DESC;
