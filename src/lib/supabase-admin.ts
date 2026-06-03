/**
 * supabase-admin.ts — SERVER ONLY
 * Uses SUPABASE_SERVICE_ROLE_KEY which is never exposed to the browser.
 * Import this ONLY in Server Components, Server Actions, and API routes.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
