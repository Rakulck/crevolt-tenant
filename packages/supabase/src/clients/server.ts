import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "../types"

export async function createServerClientFromEnv() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      )
    }

    const cookieStore = await cookies()

    const client = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        },
      },
    })

    return client
  } catch (error) {
    console.error("Failed to create Supabase server client:", error)
    throw error
  }
}
