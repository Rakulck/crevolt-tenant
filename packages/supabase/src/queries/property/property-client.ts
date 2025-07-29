"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

import type { Property, PropertyStats } from "./property-server"

// Client-side property fetching
export async function getUserProperties(): Promise<Property[]> {
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

    // Get user properties
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("Properties fetch error:", propertiesError)
      return []
    }

    return properties || []
  } catch (error) {
    console.error("Get properties error (client):", error)
    return []
  }
}

// Get user properties with tenant counts and risk data
export async function getUserPropertiesWithStats(): Promise<
  (Property & { tenantCount: number; averageRisk: number })[]
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

    // Get user properties with tenant counts
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        `
        *,
        tenants!tenants_property_id_fkey (
          id,
          current_risk_level
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("Properties with stats fetch error:", propertiesError)
      return []
    }

    // Calculate tenant counts and average risk
    const propertiesWithStats = (properties || []).map((property: any) => {
      const tenants = property.tenants || []
      const tenantCount = tenants.length

      // Calculate average risk (placeholder - you'll need actual risk calculation)
      const averageRisk =
        tenantCount > 0
          ? Math.round(Math.random() * 50) // TODO: Replace with actual risk calculation
          : 0

      // Remove the tenants array and add our calculated stats
      const { tenants: _, ...propertyWithoutTenants } = property

      return {
        ...propertyWithoutTenants,
        tenantCount,
        averageRisk,
      }
    })

    return propertiesWithStats
  } catch (error) {
    console.error("Get properties with stats error (client):", error)
    return []
  }
}

// Get a single property by ID
export async function getPropertyById(
  propertyId: string,
): Promise<Property | null> {
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

    // Get specific property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("user_id", user.id) // Ensure user owns the property
      .single()

    if (propertyError) {
      console.error("Property fetch error:", propertyError)
      return null
    }

    return property
  } catch (error) {
    console.error("Get property error (client):", error)
    return null
  }
}

// Subscribe to property changes (real-time)
export function subscribeToUserProperties(
  userId: string,
  callback: (properties: Property[]) => void,
) {
  const supabase = createClient()

  const subscription = supabase
    .channel("user_properties_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "properties",
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all properties when any property changes
        const properties = await getUserProperties()
        callback(properties)
      },
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

export async function getPropertyStatsClient(): Promise<PropertyStats | null> {
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

    // Get user properties with tenant counts
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        `
        *,
        tenants (
          id,
          monthly_rent,
          current_risk_level
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (propertiesError) {
      console.error("Properties stats fetch error:", propertiesError)
      return null
    }

    // Calculate stats
    const totalProperties = properties?.length || 0
    let totalRisk = 0
    let highRiskCount = 0
    let totalRevenue = 0

    properties?.forEach((property) => {
      const tenants = property.tenants || []

      // Calculate risk
      tenants.forEach((tenant: any) => {
        // Convert risk level to number (0-100)
        const riskScore =
          tenant.current_risk_level === "high"
            ? 75
            : tenant.current_risk_level === "medium"
              ? 50
              : tenant.current_risk_level === "low"
                ? 25
                : 0

        totalRisk += riskScore
        if (tenant.current_risk_level === "high") {
          highRiskCount++
        }

        // Calculate revenue
        totalRevenue += tenant.monthly_rent || 0
      })
    })

    const averageRiskScore =
      totalProperties > 0 ? Math.round(totalRisk / totalProperties) : 0

    // For this example, we're using simple change calculations
    // In a real app, you'd want to get historical data for more accurate trends
    const propertyChangeLastMonth = 2 // Placeholder
    const riskChangeLastMonth = -3 // Placeholder
    const highRiskChangeLastMonth = 0 // Placeholder
    const revenueChangeLastMonth = 12 // Placeholder

    return {
      totalProperties,
      averageRiskScore,
      highRiskCount,
      totalRevenue,
      propertyChangeLastMonth,
      riskChangeLastMonth,
      highRiskChangeLastMonth,
      revenueChangeLastMonth,
    }
  } catch (error) {
    console.error("Get property stats error (client):", error)
    return null
  }
}
