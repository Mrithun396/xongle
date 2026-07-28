import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    })
  }

  return client
}

// This keeps existing imports working while reusing the cached singleton.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return createClient()[prop as keyof ReturnType<typeof createClient>]
  }
})

/**
 * A plain Supabase client without the @supabase/ssr fetch interceptor.
 * Use for reading public data where auth session cookies are not needed.
 * The SSR client's internal interceptor can hang after session refresh
 * on some Netlify deployments; this client bypasses that layer entirely.
 */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}