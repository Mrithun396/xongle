import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return client
}

// This keeps existing imports working while reusing the cached singleton.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return createClient()[prop as keyof ReturnType<typeof createClient>]
  }
})