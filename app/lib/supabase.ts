import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// This makes every file work - creates a fresh client each time it's accessed
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return createClient()[prop as keyof ReturnType<typeof createClient>]
  }
})