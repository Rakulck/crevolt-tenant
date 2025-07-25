"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

import type { Tables } from "../../types/db"

export type AnalysisRequest = Tables<"analysis_requests">
export type RiskAssessment = Tables<"risk_assessments">
export type RecommendedAction = Tables<"recommended_actions">

// Enhanced type for analysis requests with related data
export interface AnalysisRequestWithDetails extends AnalysisRequest {
  risk_assessments?: RiskAssessment[]
  recommended_actions?: RecommendedAction[]
}

// Get analysis requests for current user
export async function getAnalysisRequests(): Promise<AnalysisRequest[]> {
  try {
    console.log("📊 [AnalysisClient] Fetching user analysis requests...")

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return []
    }

    const { data: requests, error } = await supabase
      .from("analysis_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching analysis requests:",
        error,
      )
      return []
    }

    console.log(
      "✅ [AnalysisClient] Fetched analysis requests:",
      requests.length,
    )
    return requests || []
  } catch (error) {
    console.error("💥 [AnalysisClient] Get analysis requests failed:", error)
    return []
  }
}

// Get risk assessments for a specific property
export async function getPropertyRiskAssessments(
  propertyId: string,
): Promise<RiskAssessment[]> {
  try {
    console.log(
      "📊 [AnalysisClient] Fetching risk assessments for property:",
      propertyId,
    )

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return []
    }

    const { data: assessments, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .order("assessment_date", { ascending: false })

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching risk assessments:",
        error,
      )
      return []
    }

    console.log(
      "✅ [AnalysisClient] Fetched risk assessments:",
      assessments.length,
    )
    return assessments || []
  } catch (error) {
    console.error(
      "💥 [AnalysisClient] Get property risk assessments failed:",
      error,
    )
    return []
  }
}

// Get risk assessment by ID with recommended actions
export async function getRiskAssessmentById(
  assessmentId: string,
): Promise<
  (RiskAssessment & { recommended_actions?: RecommendedAction[] }) | null
> {
  try {
    console.log("📊 [AnalysisClient] Fetching risk assessment:", assessmentId)

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return null
    }

    const { data: assessment, error } = await supabase
      .from("risk_assessments")
      .select(
        `
        *,
        recommended_actions (*)
      `,
      )
      .eq("id", assessmentId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching risk assessment:",
        error,
      )
      return null
    }

    console.log("✅ [AnalysisClient] Fetched risk assessment with actions")
    return assessment
  } catch (error) {
    console.error(
      "💥 [AnalysisClient] Get risk assessment by ID failed:",
      error,
    )
    return null
  }
}

// Get user's analysis history with details
export async function getUserAnalysisHistory(): Promise<
  AnalysisRequestWithDetails[]
> {
  try {
    console.log("📊 [AnalysisClient] Fetching user analysis history...")

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return []
    }

    const { data: history, error } = await supabase
      .from("analysis_requests")
      .select(
        `
        *,
        risk_assessments (*),
        recommended_actions (*)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) // Limit to recent 50 analyses

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching analysis history:",
        error,
      )
      return []
    }

    console.log("✅ [AnalysisClient] Fetched analysis history:", history.length)
    return history || []
  } catch (error) {
    console.error(
      "💥 [AnalysisClient] Get user analysis history failed:",
      error,
    )
    return []
  }
}

// Get latest risk assessment for each tenant in a property
export async function getLatestTenantRiskAssessments(
  propertyId: string,
): Promise<RiskAssessment[]> {
  try {
    console.log(
      "📊 [AnalysisClient] Fetching latest tenant risk assessments for property:",
      propertyId,
    )

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return []
    }

    // Get the most recent risk assessment for each tenant
    const { data: assessments, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .order("assessment_date", { ascending: false })

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching latest risk assessments:",
        error,
      )
      return []
    }

    // Group by tenant and keep only the latest assessment for each
    const latestAssessments = new Map<string, RiskAssessment>()

    assessments?.forEach((assessment) => {
      const tenantKey = `${assessment.tenant_name}-${assessment.unit_number}`
      const existing = latestAssessments.get(tenantKey)

      if (
        !existing ||
        new Date(assessment.assessment_date) >
          new Date(existing.assessment_date)
      ) {
        latestAssessments.set(tenantKey, assessment)
      }
    })

    const result = Array.from(latestAssessments.values())
    console.log(
      "✅ [AnalysisClient] Fetched latest tenant risk assessments:",
      result.length,
    )

    return result
  } catch (error) {
    console.error(
      "💥 [AnalysisClient] Get latest tenant risk assessments failed:",
      error,
    )
    return []
  }
}

// Get recommended actions for a property
export async function getPropertyRecommendedActions(
  propertyId: string,
): Promise<RecommendedAction[]> {
  try {
    console.log(
      "🎯 [AnalysisClient] Fetching recommended actions for property:",
      propertyId,
    )

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [AnalysisClient] Auth error:", authError)
      return []
    }

    const { data: actions, error } = await supabase
      .from("recommended_actions")
      .select(
        `
        *,
        risk_assessments!inner (
          property_id,
          tenant_name,
          unit_number
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("risk_assessments.property_id", propertyId)
      .eq("status", "pending")
      .order("priority_level", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error(
        "❌ [AnalysisClient] Error fetching recommended actions:",
        error,
      )
      return []
    }

    console.log(
      "✅ [AnalysisClient] Fetched recommended actions:",
      actions.length,
    )
    return actions || []
  } catch (error) {
    console.error(
      "💥 [AnalysisClient] Get property recommended actions failed:",
      error,
    )
    return []
  }
}
