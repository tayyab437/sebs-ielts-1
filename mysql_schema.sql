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
  id VARCHAR(36) PRIMARY KEY,
  title LONGTEXT NOT NULL,
  level LONGTEXT DEFAULT '7.0',
  type LONGTEXT DEFAULT 'Academic',
  difficulty LONGTEXT DEFAULT 'Intermediate',
  description LONGTEXT,
  content LONGTEXT,
  category LONGTEXT,
  modules LONGTEXT, -- Stores JSON syllabus structure
  status LONGTEXT DEFAULT 'Published', -- 'Draft' or 'Published'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For existing databases, ensure columns are added
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status LONGTEXT DEFAULT 'Published';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content LONGTEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category LONGTEXT;

-- Mock Tests Table
CREATE TABLE IF NOT EXISTS mock_tests (
  id VARCHAR(36) PRIMARY KEY,
  name LONGTEXT NOT NULL,
  difficulty LONGTEXT DEFAULT '7.0',
  questions INT DEFAULT 40,
  status LONGTEXT DEFAULT 'Draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(36) PRIMARY KEY,
  title LONGTEXT NOT NULL,
  description LONGTEXT,
  questions LONGTEXT, -- Stores JSON quiz questions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(36) PRIMARY KEY,
  name LONGTEXT NOT NULL,
  type LONGTEXT DEFAULT 'PDF',
  size LONGTEXT DEFAULT '0 MB',
  url LONGTEXT,
  tags LONGTEXT, -- Stores JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student Submissions Table
CREATE TABLE IF NOT EXISTS student_submissions (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36),
  student_name LONGTEXT,
  course_id VARCHAR(36),
  course_title LONGTEXT,
  module_idx INT,
  lesson_title LONGTEXT,
  lesson_type LONGTEXT,
  content LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table (Student Data)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email LONGTEXT,
  first_name LONGTEXT,
  last_name LONGTEXT,
  full_name LONGTEXT,
  avatar_url LONGTEXT,
  role LONGTEXT,
  target_band DECIMAL(10,2) DEFAULT 8.0,
  current_band DECIMAL(10,2) DEFAULT 6.0,
  predicted_band DECIMAL(10,2) DEFAULT 7.5,
  streak INT DEFAULT 12,
  xp INT DEFAULT 2450,
  exam_type LONGTEXT DEFAULT 'Academic',
  last_lesson LONGTEXT DEFAULT 'Orientation Lecture',
  status LONGTEXT DEFAULT 'Active',
  plan LONGTEXT DEFAULT 'Free Trial',
  module_progress JSON DEFAULT ('{}'),
  completed_lessons JSON DEFAULT ('[]'),
  current_state JSON DEFAULT ('{}'),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)

-- IMPORTANT: Create broad access policies for development.
-- In a production app, you should restrict these to authenticated users or specific roles.







-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id VARCHAR(36) PRIMARY KEY,
  name LONGTEXT NOT NULL,
  role LONGTEXT DEFAULT 'Student',
  comment LONGTEXT NOT NULL,
  rating INT DEFAULT 5,
  avatar_url LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for testimonials

-- Allow all access policy for testimonials
