import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const isValidUrl = (url?: string, key?: string) => {
  if (!url || !key) return false;
  const u = url.trim();
  const k = key.trim();
  if (u === '' || k === '') return false;
  if (u.includes('MY_SUPABASE_URL') || u.includes('placeholder')) return false;
  if (k.includes('MY_SUPABASE_ANON_KEY') || k.includes('placeholder')) return false;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
};

const isValid = isValidUrl(supabaseUrl, supabaseServiceKey);

export const supabaseAdmin = isValid
  ? createClient(supabaseUrl!.trim(), supabaseServiceKey!.trim())
  : null as any;

