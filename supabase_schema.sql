-- Run this in your Supabase SQL Editor to set up the database tables

------------------------------------------------------------------
-- QUICK FIX: If you are getting "RLS Violation" errors:
-- Option A (Recommended): Ensure you run the POLICY lines (45+) below.
-- Option B (Nuclear): Run these to disable security checks entirely:
-- ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_tests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
------------------------------------------------------------------

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT DEFAULT '7.0',
  type TEXT DEFAULT 'Academic',
  difficulty TEXT DEFAULT 'Intermediate',
  description TEXT,
  content TEXT,
  category TEXT,
  modules TEXT, -- Stores JSON syllabus structure
  status TEXT DEFAULT 'Published', -- 'Draft' or 'Published'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- For existing databases, ensure columns are added
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;

-- Mock Tests Table
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  difficulty TEXT DEFAULT '7.0',
  questions INTEGER DEFAULT 40,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT, -- Stores JSON quiz questions
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PDF',
  size TEXT DEFAULT '0 MB',
  url TEXT,
  tags TEXT, -- Stores JSON array of tags
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student Submissions Table
CREATE TABLE IF NOT EXISTS student_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID,
  student_name TEXT,
  course_id UUID,
  course_title TEXT,
  module_idx INTEGER,
  lesson_title TEXT,
  lesson_type TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles Table (Student Data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  target_band NUMERIC DEFAULT 8.0,
  current_band NUMERIC DEFAULT 6.0,
  predicted_band NUMERIC DEFAULT 7.5,
  streak INTEGER DEFAULT 12,
  xp INTEGER DEFAULT 2450,
  exam_type TEXT DEFAULT 'Academic',
  last_lesson TEXT DEFAULT 'Orientation Lecture',
  status TEXT DEFAULT 'Active',
  plan TEXT DEFAULT 'Free Trial',
  module_progress JSONB DEFAULT '{}',
  completed_lessons TEXT[] DEFAULT '{}',
  current_state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Create broad access policies for development.
-- In a production app, you should restrict these to authenticated users or specific roles.

DROP POLICY IF EXISTS "Allow all access" ON courses;
CREATE POLICY "Allow all access" ON courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON mock_tests;
CREATE POLICY "Allow all access" ON mock_tests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON quizzes;
CREATE POLICY "Allow all access" ON quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON resources;
CREATE POLICY "Allow all access" ON resources FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON student_submissions;
CREATE POLICY "Allow all access" ON student_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON profiles;
CREATE POLICY "Allow all access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Student',
  comment TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Allow all access policy for testimonials
DROP POLICY IF EXISTS "Allow all access" ON testimonials;
CREATE POLICY "Allow all access" ON testimonials FOR ALL USING (true) WITH CHECK (true);
