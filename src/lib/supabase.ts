/**
 * supabase.ts — CLIENT + SERVER SAFE
 * Only uses NEXT_PUBLIC_ variables that are safe to expose to the browser.
 * Use this for Realtime subscriptions and client-side queries.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
