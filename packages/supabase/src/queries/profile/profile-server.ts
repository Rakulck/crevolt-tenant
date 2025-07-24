"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createServerClientFromEnv } from "../../clients/server"

import type { Tables } from "../../types/db"

// Type for profile updates
export interface ProfileUpdateData {
  full_name?: string
  company_name?: string
  phone?: string
  timezone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  profile_image_url?: string
}

export type UserProfile = Tables<"user_profiles">

// Validation schemas
const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional(),
  company_name: z.string().min(1, "Company name is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  timezone: z.string().optional(),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  postal_code: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format")
    .optional(),
  country: z.string().min(1, "Country is required").optional(),
  profile_image_url: z.string().url().optional().or(z.literal("")),
  notification_preferences: z.record(z.boolean()).optional(),
  dashboard_preferences: z.record(z.any()).optional(),
})

const updateNotificationSchema = z.object({
  email: z.boolean().optional(),
  risk_alerts: z.boolean().optional(),
  analysis_complete: z.boolean().optional(),
  marketing: z.boolean().optional(),
})

// Server action to update profile
export async function updateProfile(updates: ProfileUpdateData) {
  try {
    console.log("=== Update Profile Process Started ===")
    console.log("Updates:", updates)

    // Validate input
    const validatedData = updateProfileSchema.parse(updates)
    console.log("Validation passed")

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    console.log("Updating profile for user:", user.id)

    // Update profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      throw error
    }

    console.log("Profile updated successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard")

    console.log("=== Update Profile Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

// Server action to update notification preferences
export async function updateNotificationPreferences(preferences: {
  email?: boolean
  risk_alerts?: boolean
  analysis_complete?: boolean
  marketing?: boolean
}) {
  try {
    console.log("=== Update Notifications Process Started ===")

    const validatedData = updateNotificationSchema.parse(preferences)
    const supabase = await createServerClientFromEnv()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Get current preferences
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single()

    const currentPrefs =
      (currentProfile?.notification_preferences as Record<string, boolean>) ||
      {}
    const newPrefs = { ...currentPrefs, ...validatedData }

    // Update notification preferences
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        notification_preferences: newPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/dashboard/profile")

    console.log("=== Update Notifications Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Update notifications error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update notifications",
    }
  }
}

// Server action to update dashboard preferences
export async function updateDashboardPreferences(preferences: {
  default_view?: string
  show_tutorials?: boolean
  theme?: string
}) {
  try {
    const supabase = await createServerClientFromEnv()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Get current preferences
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("dashboard_preferences")
      .eq("id", user.id)
      .single()

    const currentPrefs =
      (currentProfile?.dashboard_preferences as Record<string, any>) || {}
    const newPrefs = { ...currentPrefs, ...preferences }

    // Update dashboard preferences
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        dashboard_preferences: newPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Update dashboard preferences error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update preferences",
    }
  }
}
