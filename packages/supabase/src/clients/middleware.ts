import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "../types"

export const updateSession = async (
  request: NextRequest,
  initialResponse: NextResponse,
) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables not available in middleware.")
    // Return the initial response without authentication
    return { response: initialResponse, user: null }
  }

  let response = initialResponse

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  // Get user data (more secure than getSession for server-side)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.warn("Auth validation error in middleware:", error.message)
  }

  return {
    response,
    user: user ?? null,
  }
}
