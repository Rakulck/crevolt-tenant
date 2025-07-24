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
