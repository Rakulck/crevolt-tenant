import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "../types"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build time, environment variables might not be available
    // Return a mock client that will fail gracefully
    if (typeof window === 'undefined') {
      // Server-side during build - return a mock
      return null as any
    }
    
    throw new Error(
      "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
