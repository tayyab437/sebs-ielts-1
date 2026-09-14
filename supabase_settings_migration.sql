CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  favicon_url TEXT,
  favicon_alt TEXT,
  logo_url TEXT,
  logo_alt TEXT,
  hero_image_url TEXT,
  hero_image_alt TEXT,
  audio_url TEXT,
  audio_transcript TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.define_broad_policy(table_name TEXT, policy_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = table_name AND policyname = policy_name
  ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', policy_name, table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT public.define_broad_policy('site_settings', 'Allow all access');
