"use client"

import { useEffect, useState } from "react"

import { useToast } from "@/components/ui/use-toast"

import {
  type UserProfile,
  getProfileClient,
  subscribeToProfile,
  updateDashboardPreferences,
  updateNotificationPreferences,
  updateProfile,
} from "../packages/supabase/src/queries/profile"

import { useAuth } from "./use-auth"

export function useProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Fetch profile data
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    async function fetchProfile() {
      try {
        const profileData = await getProfileClient()
        setProfile(profileData)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToProfile(user.id, (updatedProfile) => {
      setProfile(updatedProfile)
    })

    return unsubscribe
  }, [user])

  // Update profile function
  const handleUpdateProfile = async (updates: {
    full_name?: string
    company_name?: string
    phone?: string
    timezone?: string
    profile_image_url?: string
  }) => {
    setUpdating(true)
    try {
      const result = await updateProfile(updates)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Profile updated successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    } finally {
      setUpdating(false)
    }
  }

  // Update notifications function
  const handleUpdateNotifications = async (preferences: {
    email?: boolean
    risk_alerts?: boolean
    analysis_complete?: boolean
    marketing?: boolean
  }) => {
    setUpdating(true)
    try {
      const result = await updateNotificationPreferences(preferences)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Notification preferences updated",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update notifications"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    } finally {
      setUpdating(false)
    }
  }

  // Update dashboard preferences function
  const handleUpdateDashboard = async (preferences: {
    default_view?: string
    show_tutorials?: boolean
    theme?: string
  }) => {
    try {
      const result = await updateDashboardPreferences(preferences)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Dashboard preferences updated",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update preferences"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    }
  }

  return {
    profile,
    loading,
    updating,
    setProfile, // Expose setProfile for optimistic updates
    updateProfile: handleUpdateProfile,
    updateNotifications: handleUpdateNotifications,
    updateDashboard: handleUpdateDashboard,
  }
}
