import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({
    path: ".env"
});

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);