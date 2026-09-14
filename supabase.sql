-- Supabase Database Schema for IELTS Course Designer

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    thumbnail_url TEXT,
    course_type TEXT NOT NULL,
    layout_type TEXT NOT NULL DEFAULT 'single',
    status TEXT NOT NULL DEFAULT 'draft',
    modules JSONB,
    thumbnail_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For existing database, add columns safely
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS test_number TEXT;

CREATE TABLE IF NOT EXISTS course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
    page_name TEXT NOT NULL,
    layout_type TEXT NOT NULL DEFAULT 'single',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES course_pages(id) ON DELETE CASCADE,
    panel TEXT NOT NULL CHECK (panel IN ('single', 'left', 'right')),
    block_type TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    data_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_pages_course_id ON course_pages(course_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_location ON page_blocks(course_id, page_id, panel);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
