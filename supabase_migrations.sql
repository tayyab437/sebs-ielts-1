-- Supabase Schema for Course Architecture
-- Drop existing tables if they exist (for clean runs)
-- Uncomment these if you want to rebuild:
-- drop table if exists page_blocks cascade;
-- drop table if exists course_pages cascade;
-- drop table if exists course_sections cascade;
-- drop table if exists courses cascade;

-- 1. Courses Table
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  title varchar(255) not null,
  description text,
  content text,
  category varchar(100),
  level varchar(50),
  difficulty varchar(50),
  type varchar(50), -- Academic / General Training
  course_format varchar(50), -- four_skills, reading, writing, etc.
  tags text[], 
  status varchar(50) default 'Draft',
  featured_image text,
  modules text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ensure columns exist even if the table was already created
alter table courses add column if not exists content text;
alter table courses add column if not exists category varchar(100);
alter table courses add column if not exists modules text;

-- 2. Course Sections Table
create table if not exists course_sections (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title varchar(255) not null,
  order_index integer not null default 0,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Course Pages Table
create table if not exists course_pages (
  id uuid default gen_random_uuid() primary key,
  section_id uuid references course_sections(id) on delete cascade not null,
  title varchar(255) not null,
  order_index integer not null default 0,
  page_type varchar(50) not null, -- learning, practice, mixed
  layout_type varchar(50) not null default 'single', -- single, split
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Page Blocks Table
create table if not exists page_blocks (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references course_pages(id) on delete cascade not null,
  block_type varchar(50) not null, -- heading, text, mcq, fill-blanks, true-false-not-given
  zone varchar(50) not null default 'single', -- single, left, right
  order_index integer not null default 0,
  data_json jsonb not null default '{}'::jsonb, -- dynamic payload depending on block_type
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Automatically update `updated_at` columns when rows change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
    t text;
begin
    for t in select table_name from information_schema.tables where table_schema = 'public' and table_name in ('courses', 'course_sections', 'course_pages', 'page_blocks')
    loop
        execute format('
            drop trigger if exists set_updated_at on %I;
            create trigger set_updated_at
            before update on %I
            for each row execute function public.handle_updated_at();
        ', t, t);
    end loop;
end;
$$;

-- Enable Row Level Security (RLS)
alter table courses enable row level security;
alter table course_sections enable row level security;
alter table course_pages enable row level security;
alter table page_blocks enable row level security;

-- Policies for anon/authenticated access
drop policy if exists "Allow public read access for courses" on courses;
create policy "Allow all access for courses" on courses for all using (true) with check (true);

drop policy if exists "Allow public read access for course_sections" on course_sections;
create policy "Allow all access for course_sections" on course_sections for all using (true) with check (true);

drop policy if exists "Allow public read access for course_pages" on course_pages;
create policy "Allow all access for course_pages" on course_pages for all using (true) with check (true);

drop policy if exists "Allow public read access for page_blocks" on page_blocks;
create policy "Allow all access for page_blocks" on page_blocks for all using (true) with check (true);

-- 5. Pricing Plans Table
create table if not exists pricing_plans (
  id varchar(255) primary key,
  name varchar(255) not null,
  category varchar(100) not null,
  tagline text,
  "priceDisplay" varchar(100),
  "priceVal" integer default 0,
  period varchar(100),
  description text,
  features text[],
  cta varchar(255),
  "isPopular" boolean default false,
  accent varchar(255),
  "detailedCurriculum" jsonb,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

alter table pricing_plans enable row level security;
drop policy if exists "Allow all access for pricing_plans" on pricing_plans;
create policy "Allow all access for pricing_plans" on pricing_plans for all using (true) with check (true);

