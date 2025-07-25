"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { TenantDefaultAnalyzer } from "@/services/documents/analyzers/TenantDefaultAnalyzer"

import { createServerClientFromEnv } from "../../clients/server"
import {
  createAnalysisRequest,
  saveRecommendedActions,
  saveRiskAssessments,
  updateAnalysisStatus,
} from "../analysis"

import type { Tables } from "../../types/db"

export type Tenant = Tables<"tenants">

// Validation schemas
const createTenantSchema = z.object({
  property_id: z.string().uuid("Invalid property ID"),
  tenant_name: z.string().min(1, "Tenant name is required"),
  unit_number: z.string().min(1, "Unit number is required"),
  ssn: z.string().optional(), // SSN for tenant identification
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  stated_annual_income: z
    .number()
    .positive("Income must be positive")
    .optional(),
  monthly_rent: z.number().positive("Monthly rent must be positive"),
  lease_start_date: z.string().optional(), // Date string from frontend
  lease_end_date: z.string().optional(),
  number_of_occupants: z
    .number()
    .int()
    .min(1, "Must have at least 1 occupant")
    .optional(),
  security_deposit: z
    .number()
    .min(0, "Security deposit cannot be negative")
    .optional(),
  pet_deposit: z.number().min(0, "Pet deposit cannot be negative").optional(),
  pets_allowed: z.boolean().optional(),
  smoking_allowed: z.boolean().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  payment_method: z.string().optional(),
  payment_due_date: z.number().int().min(1).max(31).optional(),
  notes: z.string().optional(),
})

const updateTenantSchema = createTenantSchema.partial().extend({
  id: z.string().uuid("Invalid tenant ID"),
})

// Type for tenant creation
export interface CreateTenantData {
  property_id: string
  tenant_name: string
  unit_number: string
  ssn?: string // Social Security Number for tenant identification
  email?: string
  phone?: string
  stated_annual_income?: number
  monthly_rent: number
  lease_start_date?: string
  lease_end_date?: string
  number_of_occupants?: number
  security_deposit?: number
  pet_deposit?: number
  pets_allowed?: boolean
  smoking_allowed?: boolean
  emergency_contact_name?: string
  emergency_contact_phone?: string
  payment_method?: string
  payment_due_date?: number
  notes?: string
}

// Type for tenant updates
export interface UpdateTenantData extends Partial<CreateTenantData> {
  id: string
}

// Result type for tenant operations
interface TenantResult {
  success: boolean
  data?: Tenant
  error?: string
}

// Server action to create a new tenant
export async function createTenant(
  tenantData: CreateTenantData,
): Promise<TenantResult> {
  try {
    console.log("=== Create Tenant Process Started ===")
    console.log("Tenant data:", tenantData)

    // Validate input
    const validatedData = createTenantSchema.parse(tenantData)
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

    console.log("Creating tenant for user:", user.id)

    // Create tenant in database
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        user_id: user.id,
        property_id: validatedData.property_id,
        tenant_name: validatedData.tenant_name,
        unit_number: validatedData.unit_number,
        ssn: validatedData.ssn || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        stated_annual_income: validatedData.stated_annual_income || null,
        monthly_rent: validatedData.monthly_rent,
        lease_start_date: validatedData.lease_start_date || null,
        lease_end_date: validatedData.lease_end_date || null,
        number_of_occupants: validatedData.number_of_occupants || null,
        security_deposit: validatedData.security_deposit || null,
        pet_deposit: validatedData.pet_deposit || null,
        pets_allowed: validatedData.pets_allowed || null,
        smoking_allowed: validatedData.smoking_allowed || null,
        emergency_contact_name: validatedData.emergency_contact_name || null,
        emergency_contact_phone: validatedData.emergency_contact_phone || null,
        payment_method: validatedData.payment_method || null,
        payment_due_date: validatedData.payment_due_date || null,
        notes: validatedData.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Tenant creation error:", error)
      throw error
    }

    console.log("Tenant created successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/add-tenant")

    console.log("=== Create Tenant Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Create tenant error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tenant",
    }
  }
}

// Server action to update an existing tenant
export async function updateTenant(
  tenantData: UpdateTenantData,
): Promise<TenantResult> {
  try {
    console.log("=== Update Tenant Process Started ===")
    console.log("Tenant update data:", tenantData)

    // Validate input
    const validatedData = updateTenantSchema.parse(tenantData)
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

    console.log("Updating tenant for user:", user.id)

    // Extract ID and prepare update data
    const { id, ...updateData } = validatedData

    // Prepare update payload with proper null handling
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    }

    if (updateData.tenant_name)
      updatePayload.tenant_name = updateData.tenant_name
    if (updateData.unit_number)
      updatePayload.unit_number = updateData.unit_number
    if (updateData.ssn !== undefined) updatePayload.ssn = updateData.ssn || null
    if (updateData.email !== undefined)
      updatePayload.email = updateData.email || null
    if (updateData.phone !== undefined)
      updatePayload.phone = updateData.phone || null
    if (updateData.stated_annual_income !== undefined)
      updatePayload.stated_annual_income =
        updateData.stated_annual_income || null
    if (updateData.monthly_rent)
      updatePayload.monthly_rent = updateData.monthly_rent
    if (updateData.lease_start_date !== undefined)
      updatePayload.lease_start_date = updateData.lease_start_date || null
    if (updateData.lease_end_date !== undefined)
      updatePayload.lease_end_date = updateData.lease_end_date || null
    if (updateData.number_of_occupants !== undefined)
      updatePayload.number_of_occupants = updateData.number_of_occupants || null
    if (updateData.security_deposit !== undefined)
      updatePayload.security_deposit = updateData.security_deposit || null
    if (updateData.pet_deposit !== undefined)
      updatePayload.pet_deposit = updateData.pet_deposit || null
    if (updateData.pets_allowed !== undefined)
      updatePayload.pets_allowed = updateData.pets_allowed
    if (updateData.smoking_allowed !== undefined)
      updatePayload.smoking_allowed = updateData.smoking_allowed
    if (updateData.emergency_contact_name !== undefined)
      updatePayload.emergency_contact_name =
        updateData.emergency_contact_name || null
    if (updateData.emergency_contact_phone !== undefined)
      updatePayload.emergency_contact_phone =
        updateData.emergency_contact_phone || null
    if (updateData.payment_method !== undefined)
      updatePayload.payment_method = updateData.payment_method || null
    if (updateData.payment_due_date !== undefined)
      updatePayload.payment_due_date = updateData.payment_due_date || null
    if (updateData.notes !== undefined)
      updatePayload.notes = updateData.notes || null

    // Update tenant in database
    const { data, error } = await supabase
      .from("tenants")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user owns the tenant
      .select()
      .single()

    if (error) {
      console.error("Tenant update error:", error)
      throw error
    }

    console.log("Tenant updated successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/edit-tenant/${id}`)

    console.log("=== Update Tenant Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Update tenant error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update tenant",
    }
  }
}

// Server action to delete a tenant
export async function deleteTenant(
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("=== Delete Tenant Process Started ===")
    console.log("Tenant ID:", tenantId)

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    console.log("Deleting tenant for user:", user.id)

    // Delete tenant from database
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", tenantId)
      .eq("user_id", user.id) // Ensure user owns the tenant

    if (error) {
      console.error("Tenant deletion error:", error)
      throw error
    }

    console.log("Tenant deleted successfully")

    // Revalidate relevant paths
    revalidatePath("/dashboard")

    console.log("=== Delete Tenant Process Completed ===")
    return { success: true }
  } catch (error) {
    console.error("Delete tenant error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tenant",
    }
  }
}

// Server action to create multiple tenants (bulk create)
// Helper function to trigger tenant analysis after bulk tenant creation
async function triggerTenantAnalysis(propertyId: string, tenants: Tenant[]) {
  try {
    console.log(
      "🔄 [TenantServer] Triggering auto-analysis for",
      tenants.length,
      "tenants",
    )

    // Get property details for analysis
    const supabase = await createServerClientFromEnv()
    const { data: property } = await supabase
      .from("properties")
      .select("name, address")
      .eq("id", propertyId)
      .single()

    if (!property) {
      throw new Error("Property not found for analysis")
    }

    const propertyAddress = property.address
      ? `${property.address.street_address}, ${property.address.city}, ${property.address.state} ${property.address.zip_code}`
      : null

    console.log("📝 [TenantServer] Creating analysis request...")

    // Step 1: Create analysis request record
    const analysisRequestResult = await createAnalysisRequest({
      property_id: propertyId,
      property_name: property.name || undefined,
      property_address: propertyAddress || undefined,
      include_web_search: true,
      search_location: undefined,
    })

    if (!analysisRequestResult.success) {
      throw new Error(
        `Failed to create analysis request: ${analysisRequestResult.error}`,
      )
    }

    const analysisRequest = analysisRequestResult.data!
    console.log(
      "✅ [TenantServer] Analysis request created:",
      analysisRequest.id,
    )

    // Step 2: Update analysis request status to processing
    await updateAnalysisStatus(analysisRequest.id, "processing")

    // Step 3: Perform REAL AI analysis using TenantDefaultAnalyzer
    console.log("🧠 [TenantServer] Creating TenantDefaultAnalyzer...")
    const analyzer = new TenantDefaultAnalyzer()

    // Create a rent roll CSV from tenant data for analysis
    const csvContent = createMockRentRollCSV(tenants)
    const csvBlob = new Blob([csvContent], { type: "text/csv" })
    const mockFile = new File(
      [csvBlob],
      `auto-generated-rent-roll-${propertyId}.csv`,
      { type: "text/csv" },
    )

    // Create DocumentFile wrapper (following API pattern)
    const documentFile = {
      file: mockFile,
      type: "rent_roll" as const,
      metadata: {
        propertyId,
        propertyName: property.name,
        propertyAddress,
      },
    }

    // Create analysis request (following API pattern)
    const tenantAnalysisRequest = {
      propertyName: property.name || null,
      propertyAddress: propertyAddress || null,
      analysisDate: new Date().toISOString(),
      includeWebSearch: true,
      searchLocation: null,
    }

    console.log("🎯 [TenantServer] Running REAL AI tenant analysis...")
    const analysisResult = await analyzer.analyzeRentRollForDefaults(
      documentFile,
      tenantAnalysisRequest,
    )

    console.log("✅ [TenantServer] AI Analysis completed successfully:", {
      tenantCount: analysisResult.tenantAssessments.length,
      processingTimeMs: analysisResult.processingTimeMs,
    })

    // DEBUGGING: Log the complete analysis result structure
    console.log("🔍 [TenantServer] FULL AI ANALYSIS RESULT:")
    console.log(
      "📊 tenantAssessments:",
      JSON.stringify(analysisResult.tenantAssessments, null, 2),
    )

    // Step 4: Save REAL risk assessments to database
    console.log("💾 [TenantServer] Saving AI risk assessments...")
    const riskAssessments = analysisResult.tenantAssessments.map(
      (assessment: any) => ({
        analysis_request_id: analysisRequest.id,
        tenant_id:
          tenants.find(
            (t) =>
              t.tenant_name === assessment.tenantName &&
              t.unit_number === assessment.unitNumber,
          )?.id || null,
        property_id: propertyId,
        tenant_name: assessment.tenantName,
        unit_number: assessment.unitNumber,
        risk_severity: assessment.riskSeverity,
        default_probability: assessment.defaultProbability,
        confidence_level: assessment.confidence,
        risk_factors: assessment.riskFactors || [],
        protective_factors: assessment.protectiveFactors || [],
        comments: assessment.comments || "No comments available",
        analysis_reasoning: assessment.reasoning,
        data_quality_score: assessment.dataQuality,
        monthly_rent: assessment.monthlyRent,
        lease_start_date: assessment.leaseStartDate || undefined,
        lease_end_date: assessment.leaseEndDate || undefined,
      }),
    )

    const saveAssessmentsResult = await saveRiskAssessments(riskAssessments)
    if (!saveAssessmentsResult.success) {
      throw new Error(
        `Failed to save risk assessments: ${saveAssessmentsResult.error}`,
      )
    }

    // Step 5: Save REAL recommended actions
    console.log("🎯 [TenantServer] Saving AI recommended actions...")
    const recommendedActions =
      analysisResult.recommendedActions
        ?.map((action: any) => ({
          risk_assessment_id:
            saveAssessmentsResult.data?.find(
              (ra) =>
                ra.tenant_name === action.tenantName &&
                ra.unit_number === action.unitNumber,
            )?.id || "",
          analysis_request_id: analysisRequest.id,
          action_type: action.actionType,
          priority: action.priority,
          timeline: action.timeline,
          description: action.description,
          estimated_cost: action.estimatedCost || undefined,
          affected_tenants: [action.tenantName],
          legal_requirements: action.legalRequirements || [],
          tags: action.tags || [],
        }))
        .filter((action: any) => action.risk_assessment_id) || []

    if (recommendedActions.length > 0) {
      const saveActionsResult = await saveRecommendedActions(recommendedActions)
      if (!saveActionsResult.success) {
        console.warn(
          "⚠️ [TenantServer] Failed to save recommended actions:",
          saveActionsResult.error,
        )
      }
    }

    // Step 6: Update analysis request status to completed
    await updateAnalysisStatus(analysisRequest.id, "completed", {
      processing_time_ms: analysisResult.processingTimeMs,
      total_tenants_analyzed: analysisResult.tenantAssessments.length,
      tenants_at_risk: analysisResult.tenantAssessments.filter(
        (t: any) => t.defaultProbability > 30,
      ).length,
      average_risk_probability:
        analysisResult.tenantAssessments.reduce(
          (sum: number, t: any) => sum + t.defaultProbability,
          0,
        ) / analysisResult.tenantAssessments.length,
    })

    console.log(
      "✅ [TenantServer] REAL AI Auto-analysis completed successfully:",
      analysisRequest.id,
    )
  } catch (error) {
    console.error("❌ [TenantServer] Auto-analysis trigger failed:", error)
    throw error
  }
}

// Helper to create mock CSV content from tenant data
function createMockRentRollCSV(tenants: Tenant[]): string {
  const headers = [
    "Unit Number",
    "Tenant Name",
    "Monthly Rent",
    "Lease Start",
    "Lease End",
  ]
  const csvRows = [headers.join(",")]

  tenants.forEach((tenant) => {
    const row = [
      tenant.unit_number || "",
      tenant.tenant_name || "",
      tenant.monthly_rent?.toString() || "",
      tenant.lease_start_date || "",
      tenant.lease_end_date || "",
    ]
    csvRows.push(row.join(","))
  })

  return csvRows.join("\n")
}

export async function createTenantsBulk(
  tenantsData: CreateTenantData[],
): Promise<{ success: boolean; data?: Tenant[]; error?: string }> {
  try {
    console.log("=== Bulk Create Tenants Process Started ===")
    console.log("Number of tenants:", tenantsData.length)

    // Validate all tenant data
    const validatedTenantsData = tenantsData.map((tenant) =>
      createTenantSchema.parse(tenant),
    )
    console.log("Validation passed for all tenants")

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    console.log("Creating tenants for user:", user.id)

    // Prepare tenant data for bulk insert
    const tenantsToInsert = validatedTenantsData.map((validatedData) => ({
      user_id: user.id,
      property_id: validatedData.property_id,
      tenant_name: validatedData.tenant_name,
      unit_number: validatedData.unit_number,
      ssn: validatedData.ssn || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      stated_annual_income: validatedData.stated_annual_income || null,
      monthly_rent: validatedData.monthly_rent,
      lease_start_date: validatedData.lease_start_date || null,
      lease_end_date: validatedData.lease_end_date || null,
      number_of_occupants: validatedData.number_of_occupants || null,
      security_deposit: validatedData.security_deposit || null,
      pet_deposit: validatedData.pet_deposit || null,
      pets_allowed: validatedData.pets_allowed || null,
      smoking_allowed: validatedData.smoking_allowed || null,
      emergency_contact_name: validatedData.emergency_contact_name || null,
      emergency_contact_phone: validatedData.emergency_contact_phone || null,
      payment_method: validatedData.payment_method || null,
      payment_due_date: validatedData.payment_due_date || null,
      notes: validatedData.notes || null,
    }))

    // Create tenants in database (bulk insert)
    const { data, error } = await supabase
      .from("tenants")
      .insert(tenantsToInsert)
      .select()

    if (error) {
      console.error("Bulk tenant creation error:", error)
      throw error
    }

    console.log("Tenants created successfully:", data.length)

    // Auto-trigger tenant analysis if tenants were created from rent roll extraction
    if (data.length > 0) {
      const propertyId = data[0].property_id
      console.log(
        "🎯 [TenantServer] Auto-triggering tenant analysis for property:",
        propertyId,
      )

      try {
        // Trigger tenant analysis in the background (don't wait for completion)
        triggerTenantAnalysis(propertyId, data).catch((error: any) => {
          console.error(
            "⚠️ [TenantServer] Auto-analysis trigger failed:",
            error,
          )
          // Don't fail the tenant creation if analysis fails
        })
      } catch (error) {
        console.error(
          "⚠️ [TenantServer] Failed to trigger auto-analysis:",
          error,
        )
        // Don't fail the tenant creation if analysis trigger fails
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/add-tenant")

    console.log("=== Bulk Create Tenants Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Bulk create tenants error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create tenants",
    }
  }
}
