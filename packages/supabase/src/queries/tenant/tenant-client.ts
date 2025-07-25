"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

import type { Tables } from "../../types/db"

export type Tenant = Tables<"tenants">

// Client-side tenant fetching
export async function getUserTenants(): Promise<Tenant[]> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error in client:", authError)
      return []
    }

    // Get user tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (tenantsError) {
      console.error("Tenants fetch error:", tenantsError)
      return []
    }

    return tenants || []
  } catch (error) {
    console.error("Get tenants error (client):", error)
    return []
  }
}

// Get tenants for a specific property
export async function getPropertyTenants(
  propertyId: string,
): Promise<Tenant[]> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error in client:", authError)
      return []
    }

    // Get property tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", user.id) // Ensure user owns the property
      .order("unit_number", { ascending: true })

    if (tenantsError) {
      console.error("Property tenants fetch error:", tenantsError)
      return []
    }

    return tenants || []
  } catch (error) {
    console.error("Get property tenants error (client):", error)
    return []
  }
}

// Get a single tenant by ID
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
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

    // Get specific tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .eq("user_id", user.id) // Ensure user owns the tenant
      .single()

    if (tenantError) {
      console.error("Tenant fetch error:", tenantError)
      return null
    }

    return tenant
  } catch (error) {
    console.error("Get tenant error (client):", error)
    return null
  }
}

// Subscribe to tenant changes for a property (real-time)
export function subscribeToPropertyTenants(
  propertyId: string,
  userId: string,
  callback: (tenants: Tenant[]) => void,
) {
  const supabase = createClient()

  const subscription = supabase
    .channel("property_tenants_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tenants",
        filter: `property_id=eq.${propertyId}`,
      },
      async () => {
        // Refetch property tenants when any tenant changes
        const tenants = await getPropertyTenants(propertyId)
        callback(tenants)
      },
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// Subscribe to all user tenants (real-time)
export function subscribeToUserTenants(
  userId: string,
  callback: (tenants: Tenant[]) => void,
) {
  const supabase = createClient()

  const subscription = supabase
    .channel("user_tenants_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tenants",
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all user tenants when any tenant changes
        const tenants = await getUserTenants()
        callback(tenants)
      },
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// Types for tenant risk analysis
export interface TenantRiskData {
  id: string
  tenant_name: string
  unit_number: string
  soft_credit_permission: boolean
  default_probability: number
  risk_severity: "low" | "medium" | "high" | "critical"
  monthly_rent: number
  tenant_status: string
}

export interface PropertyRiskSummary {
  property_id: string
  property_name: string
  property_address: string
  total_units: number
  occupied_units: number
  average_risk: number
  occupancy_rate: number
  tenants_at_risk: number
}

// Get tenant risk analysis data for a property - FIXED VERSION
export async function getPropertyTenantRiskAnalysis(
  propertyId: string,
): Promise<{
  summary: PropertyRiskSummary | null
  tenants: TenantRiskData[]
}> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error in client:", authError)
      return { summary: null, tenants: [] }
    }

    // Get property details first
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, name, address, total_units")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single()

    if (propertyError || !property) {
      console.error("Property fetch error:", propertyError)
      return { summary: null, tenants: [] }
    }

    console.log(
      "🔍 [TenantClient] Fetching tenant risk data for property:",
      propertyId,
    )

    // NEW APPROACH: Query risk_assessments directly and join with tenant data
    const { data: riskData, error: riskError } = await supabase
      .from("risk_assessments")
      .select(
        `
        id,
        tenant_id,
        tenant_name,
        unit_number,
        default_probability,
        risk_severity,
        monthly_rent,
        assessment_date,
        confidence_level,
        risk_factors,
        protective_factors,
        comments,
        analysis_reasoning,
        tenants!inner (
          id,
          soft_credit_permission,
          tenant_status
        )
      `,
      )
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .eq("tenants.tenant_status", "active")
      .order("assessment_date", { ascending: false })

    console.log(
      "🔍 [TenantClient] Raw risk assessment data:",
      JSON.stringify(riskData, null, 2),
    )
    console.log("🔍 [TenantClient] Risk query error:", riskError)

    if (riskError) {
      console.error("Risk assessment fetch error:", riskError)
      // Fallback: Get tenants without risk data
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(
          "id, tenant_name, unit_number, soft_credit_permission, monthly_rent, tenant_status",
        )
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .eq("tenant_status", "active")
        .order("unit_number")

      if (tenantError) {
        console.error("Fallback tenant fetch error:", tenantError)
        return { summary: null, tenants: [] }
      }

      // Return tenants with 0% risk as fallback
      const fallbackTenants: TenantRiskData[] = (tenantData || []).map(
        (tenant) => ({
          id: tenant.id,
          tenant_name: tenant.tenant_name,
          unit_number: tenant.unit_number,
          soft_credit_permission: tenant.soft_credit_permission,
          default_probability: 0,
          risk_severity: "low" as const,
          monthly_rent: tenant.monthly_rent,
          tenant_status: tenant.tenant_status,
        }),
      )

      const summary: PropertyRiskSummary = {
        property_id: property.id,
        property_name: property.name,
        property_address: `${property.address.street_address}, ${property.address.city}, ${property.address.state} ${property.address.zip_code}`,
        total_units: property.total_units || fallbackTenants.length,
        occupied_units: fallbackTenants.length,
        average_risk: 0,
        occupancy_rate:
          property.total_units > 0
            ? (fallbackTenants.length / property.total_units) * 100
            : 100,
        tenants_at_risk: 0,
      }

      return { summary, tenants: fallbackTenants }
    }

    // Group by tenant_id and get the latest assessment for each tenant
    const tenantAssessmentMap = new Map<string, any>()

    riskData?.forEach((assessment) => {
      const tenantId = assessment.tenant_id
      if (!tenantId) return

      // Keep only the most recent assessment per tenant
      if (
        !tenantAssessmentMap.has(tenantId) ||
        new Date(assessment.assessment_date) >
          new Date(tenantAssessmentMap.get(tenantId).assessment_date)
      ) {
        tenantAssessmentMap.set(tenantId, assessment)
      }
    })

    // Convert to tenant risk data array
    const tenants: TenantRiskData[] = Array.from(
      tenantAssessmentMap.values(),
    ).map((assessment) => ({
      id: assessment.tenant_id,
      tenant_name: assessment.tenant_name,
      unit_number: assessment.unit_number,
      soft_credit_permission:
        assessment.tenants?.soft_credit_permission || false,
      default_probability: assessment.default_probability || 0,
      risk_severity: assessment.risk_severity || "low",
      monthly_rent: assessment.monthly_rent,
      tenant_status: assessment.tenants?.tenant_status || "active",
    }))

    console.log("✅ [TenantClient] Processed tenant risk data:", {
      totalTenants: tenants.length,
      avgRisk:
        tenants.reduce((sum, t) => sum + t.default_probability, 0) /
          tenants.length || 0,
      riskDistribution: tenants.map((t) => ({
        name: t.tenant_name,
        risk: t.default_probability,
      })),
    })

    // Calculate summary statistics
    const occupiedUnits = tenants.length
    const totalRisk = tenants.reduce(
      (sum, tenant) => sum + tenant.default_probability,
      0,
    )
    const averageRisk = occupiedUnits > 0 ? totalRisk / occupiedUnits : 0
    const tenantsAtRisk = tenants.filter(
      (t) => t.default_probability > 30,
    ).length

    const totalUnits = property.total_units || occupiedUnits
    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    const summary: PropertyRiskSummary = {
      property_id: property.id,
      property_name: property.name,
      property_address: `${property.address.street_address}, ${property.address.city}, ${property.address.state} ${property.address.zip_code}`,
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      average_risk: Math.round(averageRisk * 10) / 10,
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      tenants_at_risk: tenantsAtRisk,
    }

    console.log("✅ [TenantClient] Final summary:", summary)

    return { summary, tenants }
  } catch (error) {
    console.error("Get property tenant risk analysis error:", error)
    return { summary: null, tenants: [] }
  }
}

// Get tenant risk analysis data for all user properties
export async function getUserPropertiesRiskSummary(): Promise<
  PropertyRiskSummary[]
> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error in client:", authError)
      return []
    }

    // Get all user properties with tenant counts and risk data
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        total_units,
        tenants!inner (
          id,
          tenant_status,
          current_risk_level,
          risk_assessments (
            default_probability
          )
        )
      `,
      )
      .eq("user_id", user.id)

    if (propertiesError) {
      console.error("Properties risk summary fetch error:", propertiesError)
      return []
    }

    // Process property summaries
    const summaries: PropertyRiskSummary[] = (properties || []).map(
      (property) => {
        const activeTenants = property.tenants.filter(
          (t) => t.tenant_status === "active",
        )
        const occupiedUnits = activeTenants.length

        const totalRisk = activeTenants.reduce((sum, tenant) => {
          const latestAssessment = tenant.risk_assessments?.[0]
          return sum + (latestAssessment?.default_probability || 0)
        }, 0)

        const averageRisk = occupiedUnits > 0 ? totalRisk / occupiedUnits : 0
        const occupancyRate =
          property.total_units > 0
            ? (occupiedUnits / property.total_units) * 100
            : 0
        const tenantsAtRisk = activeTenants.filter((t) => {
          const latestAssessment = t.risk_assessments?.[0]
          return (latestAssessment?.default_probability || 0) > 30
        }).length

        return {
          property_id: property.id,
          property_name: property.name,
          property_address: `${property.address.street_address}, ${property.address.city}, ${property.address.state} ${property.address.zip_code}`,
          total_units: property.total_units,
          occupied_units: occupiedUnits,
          average_risk: Math.round(averageRisk * 10) / 10,
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
          tenants_at_risk: tenantsAtRisk,
        }
      },
    )

    return summaries
  } catch (error) {
    console.error("Get user properties risk summary error:", error)
    return []
  }
}
