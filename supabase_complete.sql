-- ==================================================================
-- COMPLETE UNIFIED SUPABASE DATABASE SCHEMA
-- ==================================================================
-- This script contains all tables, columns, indexes, triggers,
-- and permissive Row Level Security (RLS) policies required for your app.
-- 
-- Copy and paste this entire script into your Supabase SQL Editor:
-- https://supabase.com -> Click Dashboard -> SQL Editor -> New Query -> Run
-- ==================================================================

-- 1. Create Update Timestamp Trigger Function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Courses Table (Unified with all columns, defaults, and visibility flags)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT,
  content TEXT,
  category TEXT,
  level TEXT DEFAULT '7.0',
  difficulty TEXT DEFAULT 'Intermediate',
  type TEXT DEFAULT 'Academic', -- Academic / General Training
  course_type TEXT,
  course_format TEXT,
  tags TEXT[],
  layout_type TEXT DEFAULT 'single',
  status TEXT DEFAULT 'Draft', -- 'Draft' or 'Published'
  thumbnail_url TEXT,
  featured_image TEXT,
  access_tier TEXT DEFAULT 'Free Trial', -- 'Free Trial', 'Pro Premium' or 'Mastery Ultimate'
  modules TEXT, -- Stores JSON syllabus structure / compileModulesJSON output
  show_in_practice BOOLEAN DEFAULT true,
  show_in_syllabus BOOLEAN DEFAULT true,
  is_mock_test BOOLEAN DEFAULT false,
  exam_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist for existing databases safely
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '7.0';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Intermediate';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Academic';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_type TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_format TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'single';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_tier TEXT DEFAULT 'Free Trial';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS modules TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS show_in_practice BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS show_in_syllabus BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_mock_test BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS exam_category TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS test_number TEXT;

-- 3. Course Sections Table
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist for existing databases
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Course Pages Table
CREATE TABLE IF NOT EXISTS public.course_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  page_name TEXT DEFAULT 'Main Page',
  title TEXT DEFAULT 'Main Page',
  page_type TEXT DEFAULT 'learning', -- e.g., learning, practice, mixed
  layout_type TEXT NOT NULL DEFAULT 'single', -- e.g., single, split
  sort_order INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist for existing databases
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE;
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS page_name TEXT DEFAULT 'Main Page';
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Main Page';
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'learning';
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS layout_type TEXT NOT NULL DEFAULT 'single';
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.course_pages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Page Blocks Table
CREATE TABLE IF NOT EXISTS public.page_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.course_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- e.g., heading, text, mcq, fill-blanks, true-false-not-given
  panel TEXT NOT NULL DEFAULT 'single' CHECK (panel IN ('single', 'left', 'right')),
  zone TEXT NOT NULL DEFAULT 'single', -- compatible fallback for zone
  position INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist for existing databases
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.course_pages(id) ON DELETE CASCADE;
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS block_type TEXT;
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS panel TEXT NOT NULL DEFAULT 'single';
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS zone TEXT NOT NULL DEFAULT 'single';
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS data_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.page_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure panel constraint is configured cleanly on existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'page_blocks_panel_check'
  ) THEN
    ALTER TABLE public.page_blocks ADD CONSTRAINT page_blocks_panel_check CHECK (panel IN ('single', 'left', 'right'));
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
$$;

-- 6. Mock Tests Table
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  difficulty TEXT DEFAULT '7.0',
  questions INTEGER DEFAULT 40,
  status TEXT DEFAULT 'Draft',
  is_mock_test BOOLEAN DEFAULT true,
  thumbnail TEXT,
  exam_category TEXT,
  test_month TEXT,
  test_year TEXT,
  description TEXT,
  total_time INTEGER DEFAULT 165,
  sections TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist for existing mock_tests safely
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS is_mock_test BOOLEAN DEFAULT true;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS exam_category TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS test_month TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS test_year TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS total_time INTEGER DEFAULT 165;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS sections TEXT;


-- 7. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT, -- Stores JSON quiz questions
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PDF',
  size TEXT DEFAULT '0 MB',
  url TEXT,
  tags TEXT, -- Stores JSON array or text representation of tags
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Student Submissions Table
CREATE TABLE IF NOT EXISTS public.student_submissions (
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

-- 10. Profiles Table (Student Data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- references auth.users ON DELETE CASCADE (configured safely below to prevent foreign key errors if auth schema isn't prepared yet)
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

-- Safely set up references to auth.users if auth schema is fully available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 11. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Student',
  comment TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Team Members Table (Instructors Directory)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initials TEXT,
  gradient TEXT,
  name TEXT NOT NULL,
  role TEXT,
  credentials TEXT,
  bio TEXT,
  expertise TEXT[],
  email TEXT,
  linkedin TEXT,
  instagram TEXT,
  twitter TEXT,
  avatar_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Manual Students Table (Fallback/Legacy Administration Directory)
-- Uses both lower_snake and camelCase mapping columns to ensure seamless client compatibility!
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  country TEXT,
  "examType" TEXT,
  exam_type TEXT,
  "currentBand" NUMERIC,
  current_band NUMERIC,
  "targetBand" NUMERIC,
  target_band NUMERIC,
  speaking NUMERIC,
  writing NUMERIC,
  reading NUMERIC,
  listening NUMERIC,
  "enrolledPlan" TEXT,
  enrolled_plan TEXT,
  status TEXT,
  "enrollmentDate" TEXT,
  enrollment_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13b. Dynamic Pricing Plans & Curriculum Table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tagline TEXT,
  "priceDisplay" VARCHAR(100),
  "priceVal" INTEGER DEFAULT 0,
  period VARCHAR(100),
  description TEXT,
  features TEXT[],
  cta VARCHAR(255),
  "isPopular" BOOLEAN DEFAULT false,
  accent VARCHAR(255),
  "detailedCurriculum" JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_pages_section_id ON public.course_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_course_pages_course_id ON public.course_pages(course_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page_id ON public.page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_location ON public.page_blocks(page_id, panel, zone);

-- 15. Create the triggers to automatically handle updated_at timestamps
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('courses', 'course_sections', 'course_pages', 'page_blocks')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- 16. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- 17. Broad Permissive Policies for AI Studio Development Ingress
-- This guarantees zero "RLS Violation" or "Missing or insufficient permissions" errors.

CREATE OR REPLACE FUNCTION public.define_broad_policy(table_name TEXT, policy_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

SELECT public.define_broad_policy('courses', 'Allow all access');
SELECT public.define_broad_policy('course_sections', 'Allow all access');
SELECT public.define_broad_policy('course_pages', 'Allow all access');
SELECT public.define_broad_policy('page_blocks', 'Allow all access');
SELECT public.define_broad_policy('mock_tests', 'Allow all access');
SELECT public.define_broad_policy('quizzes', 'Allow all access');
SELECT public.define_broad_policy('resources', 'Allow all access');
SELECT public.define_broad_policy('student_submissions', 'Allow all access');
SELECT public.define_broad_policy('profiles', 'Allow all access');
SELECT public.define_broad_policy('testimonials', 'Allow all access');
SELECT public.define_broad_policy('team_members', 'Allow all access');
SELECT public.define_broad_policy('students', 'Allow all access');
SELECT public.define_broad_policy('pricing_plans', 'Allow all access');

-- Clean up helper function
DROP FUNCTION public.define_broad_policy(TEXT, TEXT);

-- ==========================================
-- STORAGE BUCKETS SETUP
-- ==========================================

-- Create the "resources" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Create the "speaking-responses" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('speaking-responses', 'speaking-responses', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies to allow public access to "resources" bucket
CREATE POLICY "Public Access resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Public Insert resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');
CREATE POLICY "Public Update resources" ON storage.objects FOR UPDATE USING (bucket_id = 'resources');
CREATE POLICY "Public Delete resources" ON storage.objects FOR DELETE USING (bucket_id = 'resources');

-- Create policies to allow public access to "speaking-responses" bucket
CREATE POLICY "Public Access speaking-responses" ON storage.objects FOR SELECT USING (bucket_id = 'speaking-responses');
CREATE POLICY "Public Insert speaking-responses" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'speaking-responses');
CREATE POLICY "Public Update speaking-responses" ON storage.objects FOR UPDATE USING (bucket_id = 'speaking-responses');
CREATE POLICY "Public Delete speaking-responses" ON storage.objects FOR DELETE USING (bucket_id = 'speaking-responses');

