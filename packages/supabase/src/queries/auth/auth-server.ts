"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createServerClientFromEnv } from "../../../../../clients/server"

// Types for better type safety
type AuthResult = {
  success: boolean
  error?: string
  message?: string
  requiresConfirmation?: boolean
}

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
  company_name: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  timezone: z.string().default("America/New_York"),
})

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Sign up with user details
export async function signUpWithDetails(userData: {
  email: string
  password: string
  full_name: string
  company_name: string
  phone: string
  timezone?: string
}): Promise<AuthResult> {
  try {
    console.log("=== Sign Up Process Started ===")
    console.log("Input data:", { ...userData, password: "[REDACTED]" })

    // Validate input
    const validatedData = signUpSchema.parse(userData)
    console.log("Validation passed")

    const supabase = createServerClientFromEnv()

    // Sign up the user with metadata for the trigger
    console.log("Creating auth user with metadata...")
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          company_name: validatedData.company_name,
          phone: validatedData.phone,
          timezone: validatedData.timezone || "America/New_York",
        },
      },
    })

    if (signUpError) {
      console.error("Auth signup error:", signUpError)
      throw signUpError
    }

    if (!authData.user) {
      console.error("No user returned from auth signup")
      throw new Error("User creation failed")
    }

    console.log("Auth user created successfully:", {
      id: authData.user.id,
      email: authData.user.email,
      email_confirmed_at: authData.user.email_confirmed_at,
      role: authData.user.role,
    })

    // The database trigger will automatically create the user profile
    console.log(
      "User profile will be created automatically by database trigger"
    )
    console.log("=== Sign Up Process Completed ===")

    return {
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
      requiresConfirmation: !authData.user.email_confirmed_at,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create account",
    }
  }
}

// Sign in with email and password
export async function signIn(formData: FormData): Promise<AuthResult> {
  try {
    const validatedData = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    const supabase = createServerClientFromEnv()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      throw error
    }

    // Update last login timestamp
    if (data.user) {
      await supabase
        .from("user_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", data.user.id)
    }

    revalidatePath("/")

    return {
      success: true,
      message: "Signed in successfully",
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign in",
    }
  }
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createServerClientFromEnv()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    revalidatePath("/")

    return {
      success: true,
      message: "Signed out successfully",
    }
  } catch (error) {
    console.error("Sign out error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign out",
    }
  }
}

// Reset password request
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get("email")
    if (!email || typeof email !== "string") {
      throw new Error("Email is required")
    }

    const supabase = createServerClientFromEnv()
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      throw error
    }

    return {
      success: true,
      message: "Password reset instructions sent to your email",
    }
  } catch (error) {
    console.error("Reset password error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reset password",
    }
  }
}

// Update password
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  try {
    const validatedData = updatePasswordSchema.parse({
      password: formData.get("password"),
    })

    const supabase = createServerClientFromEnv()
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: "Password updated successfully",
    }
  } catch (error) {
    console.error("Update password error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update password",
    }
  }
}
