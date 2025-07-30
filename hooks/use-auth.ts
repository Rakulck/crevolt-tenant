"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/packages/supabase/src/clients/client"

import type { Session, User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if supabase client is available (might be null during build)
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Failed to get session:", error)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null)
        setLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    if (!supabase) {
      window.location.href = "/auth"
      return
    }
    
    try {
      await supabase.auth.signOut()
      window.location.href = "/auth"
    } catch (error) {
      console.error("Failed to sign out:", error)
      window.location.href = "/auth"
    }
  }

  return {
    user,
    loading,
    signOut,
  }
}
