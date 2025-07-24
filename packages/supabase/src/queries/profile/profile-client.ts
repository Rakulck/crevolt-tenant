"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

import type { Tables } from "../../types/db"

export type UserProfile = Tables<"user_profiles">

// Client-side profile fetching (for real-time updates)
export async function getProfileClient(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error in client:", authError)
      return null
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error("Get profile error (client):", error)
    return null
  }
}

// Subscribe to profile changes (real-time)
export function subscribeToProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
) {
  const supabase = createClient()

  const subscription = supabase
    .channel("user_profile_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        console.log("Profile changed:", payload)
        callback(payload.new as UserProfile)
      },
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
