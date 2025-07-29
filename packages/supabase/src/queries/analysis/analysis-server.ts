"use server"

import { createServerClientFromEnv } from "../../clients/server"

import type { Database, Tables } from "../../types/db"

export type AnalysisRequest = Tables<"analysis_requests">
export type RiskAssessment = Tables<"risk_assessments">
export type RecommendedAction = Tables<"recommended_actions">

// Types for creating analysis requests
export interface CreateAnalysisRequestData {
  property_id: string
  property_name?: string
  property_address?: string
  include_web_search?: boolean
  search_location?: {
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
}

// Types for saving risk assessments - Fixed to match DB schema
export interface SaveRiskAssessmentData {
  analysis_request_id: string
  tenant_id?: string
  property_id: string
  tenant_name: string
  unit_number: string
  lease_start_date?: string
  lease_end_date?: string
  monthly_rent?: number
  security_deposit?: number
  move_in_date?: string
  risk_severity: Database["public"]["Enums"]["risk_severity"]
  default_probability: number
  projected_default_timeframe?: string
  confidence_level?: number
  risk_factors?: string[]
  protective_factors?: string[]
  comments: string
  analysis_reasoning?: string
  data_quality_score?: number
}

// Types for recommended actions - Fixed to match DB schema
export interface SaveRecommendedActionData {
  risk_assessment_id: string
  analysis_request_id: string
  action_type: Database["public"]["Enums"]["next_action_type"]
  priority: Database["public"]["Enums"]["priority_level"]
  timeline: string
  description: string
  estimated_cost?: number
  affected_tenants?: string[]
  legal_requirements?: string[]
  tags?: string[]
}

// Create a new analysis request
export async function createAnalysisRequest(
  data: CreateAnalysisRequestData,
): Promise<{ success: boolean; data?: AnalysisRequest; error?: string }> {
  try {
    console.log("🎯 [AnalysisServer] Creating analysis request:", data)

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    const { data: analysisRequest, error } = await supabase
      .from("analysis_requests")
      .insert({
        user_id: user.id,
        property_id: data.property_id,
        property_name: data.property_name,
        property_address: data.property_address,
        include_web_search: data.include_web_search ?? true,
        search_location: data.search_location,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error(
        "❌ [AnalysisServer] Error creating analysis request:",
        error,
      )
      throw error
    }

    console.log(
      "✅ [AnalysisServer] Analysis request created:",
      analysisRequest.id,
    )
    return { success: true, data: analysisRequest }
  } catch (error) {
    console.error("💥 [AnalysisServer] Create analysis request failed:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create analysis request",
    }
  }
}

// Save multiple risk assessments
export async function saveRiskAssessments(
  assessments: SaveRiskAssessmentData[],
): Promise<{ success: boolean; data?: RiskAssessment[]; error?: string }> {
  try {
    console.log(
      "💾 [AnalysisServer] Saving risk assessments:",
      assessments.length,
    )

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Prepare assessment data
    const assessmentInserts = assessments.map((assessment) => ({
      analysis_request_id: assessment.analysis_request_id,
      tenant_id: assessment.tenant_id,
      user_id: user.id,
      property_id: assessment.property_id,
      tenant_name: assessment.tenant_name,
      unit_number: assessment.unit_number,
      lease_start_date: assessment.lease_start_date,
      lease_end_date: assessment.lease_end_date,
      monthly_rent: assessment.monthly_rent,
      security_deposit: assessment.security_deposit,
      move_in_date: assessment.move_in_date,
      risk_severity: assessment.risk_severity,
      default_probability: assessment.default_probability,
      projected_default_timeframe: assessment.projected_default_timeframe,
      confidence_level: assessment.confidence_level,
      risk_factors: assessment.risk_factors || [],
      protective_factors: assessment.protective_factors || [],
      comments: assessment.comments,
      analysis_reasoning: assessment.analysis_reasoning,
      data_quality_score: assessment.data_quality_score,
    }))

    console.log(
      "💾 [AnalysisServer] Attempting to save risk assessments:",
      JSON.stringify(assessmentInserts, null, 2),
    )

    const { data: savedAssessments, error } = await supabase
      .from("risk_assessments")
      .insert(assessmentInserts)
      .select()

    console.log("💾 [AnalysisServer] Database save result:", {
      savedAssessments,
      error,
    })

    if (error) {
      console.error("❌ [AnalysisServer] Error saving risk assessments:", error)
      throw error
    }

    console.log(
      "✅ [AnalysisServer] Risk assessments saved:",
      savedAssessments.length,
    )

    return { success: true, data: savedAssessments }
  } catch (error) {
    console.error("💥 [AnalysisServer] Save risk assessments failed:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save risk assessments",
    }
  }
}

// Save recommended actions
export async function saveRecommendedActions(
  actions: SaveRecommendedActionData[],
): Promise<{ success: boolean; data?: RecommendedAction[]; error?: string }> {
  try {
    console.log(
      "🎯 [AnalysisServer] Saving recommended actions:",
      actions.length,
    )

    // Debug: Log all action types being received
    console.log(
      "🔍 [AnalysisServer] AI Action types:",
      actions.map((a) => a.action_type),
    )

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Map AI-generated action types to valid database enum values
    type ValidActionType =
      | "monitor"
      | "contact_tenant"
      | "payment_plan"
      | "formal_notice"
      | "legal_consultation"
      | "eviction_process"
      | "unit_preparation"

    const mapActionType = (aiActionType: string): ValidActionType => {
      const actionMap: Record<string, ValidActionType> = {
        "Lease Renewal Discussion": "contact_tenant",
        "Lease Review": "contact_tenant",
        "Financial Review and Lease Negotiation": "contact_tenant",
        "Financial Review": "contact_tenant",
        "Lease Negotiation": "contact_tenant",
        "Regular Monitoring": "monitor",
        "Monitor Payment": "monitor",
        "Payment Monitoring": "monitor",
        "Credit Check": "contact_tenant",
        "Income Verification": "contact_tenant",
        "Legal Action": "legal_consultation",
        Eviction: "eviction_process",
        Notice: "formal_notice",
        "Payment Plan": "payment_plan",
        "Unit Preparation": "unit_preparation",
      }

      // Try exact match first
      if (actionMap[aiActionType]) {
        return actionMap[aiActionType]
      }

      // Try partial matches
      const lowerAction = aiActionType.toLowerCase()
      if (
        lowerAction.includes("lease") ||
        lowerAction.includes("contact") ||
        lowerAction.includes("review")
      ) {
        return "contact_tenant"
      }
      if (lowerAction.includes("monitor")) {
        return "monitor"
      }
      if (lowerAction.includes("payment") && lowerAction.includes("plan")) {
        return "payment_plan"
      }
      if (lowerAction.includes("legal")) {
        return "legal_consultation"
      }
      if (lowerAction.includes("notice")) {
        return "formal_notice"
      }
      if (lowerAction.includes("evict")) {
        return "eviction_process"
      }

      // Default fallback
      return "monitor"
    }

    // Prepare action data
    const actionInserts = actions.map((action) => ({
      risk_assessment_id: action.risk_assessment_id,
      analysis_request_id: action.analysis_request_id,
      user_id: user.id,
      action_type: mapActionType(action.action_type),
      priority: action.priority,
      timeline: action.timeline,
      description: action.description,
      estimated_cost: action.estimated_cost,
      affected_tenants: action.affected_tenants,
      legal_requirements: action.legal_requirements,
      tags: action.tags,
      is_completed: false,
    }))

    // Debug: Log mapped action types
    console.log(
      "🔄 [AnalysisServer] Mapped action types:",
      actionInserts.map((a) => a.action_type),
    )

    const { data: savedActions, error } = await supabase
      .from("recommended_actions")
      .insert(actionInserts)
      .select()

    if (error) {
      console.error(
        "❌ [AnalysisServer] Error saving recommended actions:",
        error,
      )
      throw error
    }

    console.log(
      "✅ [AnalysisServer] Recommended actions saved:",
      savedActions.length,
    )
    return { success: true, data: savedActions }
  } catch (error) {
    console.error("💥 [AnalysisServer] Save recommended actions failed:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save recommended actions",
    }
  }
}

// Update analysis request status
export async function updateAnalysisStatus(
  analysisRequestId: string,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  additionalData?: {
    total_tenants_analyzed?: number
    tenants_at_risk?: number
    average_risk_probability?: number
    processing_time_ms?: number
    error_message?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 [AnalysisServer] Updating analysis status:", {
      analysisRequestId,
      status,
    })

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "processing") {
      updateData.started_at = new Date().toISOString()
    } else if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString()
    }

    // Add additional data if provided
    if (additionalData) {
      Object.assign(updateData, additionalData)
    }

    const { error } = await supabase
      .from("analysis_requests")
      .update(updateData)
      .eq("id", analysisRequestId)
      .eq("user_id", user.id)

    if (error) {
      console.error(
        "❌ [AnalysisServer] Error updating analysis status:",
        error,
      )
      throw error
    }

    console.log("✅ [AnalysisServer] Analysis status updated successfully")
    return { success: true }
  } catch (error) {
    console.error("💥 [AnalysisServer] Update analysis status failed:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update analysis status",
    }
  }
}

// Get latest risk assessments for a property
export async function getLatestRiskAssessmentsByProperty(
  propertyId: string,
): Promise<{ success: boolean; data?: RiskAssessment[]; error?: string }> {
  try {
    console.log(
      "🔍 [AnalysisServer] Fetching latest risk assessments for property:",
      propertyId,
    )

    const supabase = await createServerClientFromEnv()

    // Get current user from server context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Query risk assessments for the property, getting the latest one per tenant
    const { data: riskAssessments, error } = await supabase
      .from("risk_assessments")
      .select(
        `
        id,
        analysis_request_id,
        tenant_id,
        user_id,
        property_id,
        tenant_name,
        unit_number,
        lease_start_date,
        lease_end_date,
        monthly_rent,
        security_deposit,
        move_in_date,
        risk_severity,
        default_probability,
        projected_default_timeframe,
        confidence_level,
        financial_indicators,
        payment_pattern,
        payment_frequency,
        risk_factors,
        protective_factors,
        macroeconomic_context,
        comments,
        analysis_reasoning,
        data_quality_score,
        assessment_date,
        last_updated,
        created_at
      `,
      )
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .order("assessment_date", { ascending: false })

    if (error) {
      console.error(
        "❌ [AnalysisServer] Error fetching risk assessments:",
        error,
      )
      return { success: false, error: error.message }
    }

    // Group by tenant_id and keep only the latest assessment per tenant
    const latestAssessments = new Map<string, RiskAssessment>()

    riskAssessments?.forEach((assessment) => {
      const tenantKey =
        assessment.tenant_id ||
        `${assessment.tenant_name}-${assessment.unit_number}`

      if (
        !latestAssessments.has(tenantKey) ||
        new Date(assessment.assessment_date) >
          new Date(latestAssessments.get(tenantKey)!.assessment_date)
      ) {
        latestAssessments.set(tenantKey, assessment)
      }
    })

    const finalAssessments = Array.from(latestAssessments.values())

    console.log("✅ [AnalysisServer] Latest risk assessments retrieved:", {
      total: finalAssessments.length,
      avgRisk:
        finalAssessments.reduce((sum, a) => sum + a.default_probability, 0) /
          finalAssessments.length || 0,
    })

    return { success: true, data: finalAssessments }
  } catch (error) {
    console.error(
      "❌ [AnalysisServer] Get latest risk assessments error:",
      error,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
