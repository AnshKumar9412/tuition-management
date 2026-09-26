import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// This client uses the service_role key and can bypass RLS.
// NEVER import this file into a Client Component or expose it to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}