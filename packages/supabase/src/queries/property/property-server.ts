"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createServerClientFromEnv } from "../../clients/server"

import type { Tables } from "../../types/db"

export type Property = Tables<"properties">

// Validation schemas
const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  property_type: z.enum([
    "single_family",
    "duplex",
    "triplex",
    "fourplex",
    "apartment",
    "apartment_complex",
    "condominium",
    "townhouse",
    "mixed_use",
    "other",
  ]),
  address: z.object({
    street_address: z.string().min(1, "Street address is required"),
    unit_number: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(), // Optional for international addresses
    zip_code: z.string().optional(), // Optional for international addresses
    country: z.string().default("United States"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  total_units: z.number().min(1, "Must have at least 1 unit"),
  year_built: z
    .number()
    .min(1800, "Year must be after 1800")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  description: z.string().optional(),
})

const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().uuid("Invalid property ID"),
})

// Type for property creation
export interface CreatePropertyData {
  name: string
  property_type:
    | "single_family"
    | "duplex"
    | "triplex"
    | "fourplex"
    | "apartment_complex"
    | "condominium"
    | "townhouse"
    | "mixed_use"
    | "other"
  address: {
    street_address: string
    unit_number?: string
    city: string
    state?: string // Optional for international addresses
    zip_code?: string // Optional for international addresses
    country?: string
    latitude?: number
    longitude?: number
  }
  total_units: number
  year_built?: number
  description?: string
}

// Type for property updates
export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  id: string
}

// Result type for property operations
interface PropertyResult {
  success: boolean
  data?: Property
  error?: string
}

// Server action to create a new property
export async function createProperty(
  propertyData: CreatePropertyData,
): Promise<PropertyResult> {
  try {
    console.log("=== Create Property Process Started ===")
    console.log("Property data:", propertyData)

    // Validate input
    const validatedData = createPropertySchema.parse(propertyData)
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

    console.log("Creating property for user:", user.id)

    // Create property in database
    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        property_type: validatedData.property_type,
        address: {
          ...validatedData.address,
          unit_number: validatedData.address.unit_number || null,
          state: validatedData.address.state || null, // Convert undefined to null
          zip_code: validatedData.address.zip_code || null, // Convert undefined to null
          latitude: validatedData.address.latitude || null,
          longitude: validatedData.address.longitude || null,
        },
        total_units: validatedData.total_units,
        year_built: validatedData.year_built || null,
        description: validatedData.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Property creation error:", error)
      throw error
    }

    console.log("Property created successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/add-property")

    console.log("=== Create Property Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Create property error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create property",
    }
  }
}

// Server action to update an existing property
export async function updateProperty(
  propertyData: UpdatePropertyData,
): Promise<PropertyResult> {
  try {
    console.log("=== Update Property Process Started ===")
    console.log("Property update data:", propertyData)

    // Validate input
    const validatedData = updatePropertySchema.parse(propertyData)
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

    console.log("Updating property for user:", user.id)

    // Extract ID and prepare update data
    const { id, ...updateData } = validatedData

    // Prepare update data with proper null handling
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    }

    if (updateData.name) updatePayload.name = updateData.name
    if (updateData.property_type)
      updatePayload.property_type = updateData.property_type
    if (updateData.total_units)
      updatePayload.total_units = updateData.total_units
    if (updateData.year_built !== undefined)
      updatePayload.year_built = updateData.year_built || null
    if (updateData.description !== undefined)
      updatePayload.description = updateData.description || null

    if (updateData.address) {
      updatePayload.address = {
        ...updateData.address,
        unit_number: updateData.address.unit_number || null,
        latitude: updateData.address.latitude || null,
        longitude: updateData.address.longitude || null,
      }
    }

    // Update property in database
    const { data, error } = await supabase
      .from("properties")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user owns the property
      .select()
      .single()

    if (error) {
      console.error("Property update error:", error)
      throw error
    }

    console.log("Property updated successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/edit-property/${id}`)

    console.log("=== Update Property Process Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Update property error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update property",
    }
  }
}

// Server action to delete a property
export async function deleteProperty(
  propertyId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("=== Delete Property Process Started ===")
    console.log("Property ID:", propertyId)

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    console.log("Deleting property for user:", user.id)

    // Delete property from database
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId)
      .eq("user_id", user.id) // Ensure user owns the property

    if (error) {
      console.error("Property deletion error:", error)
      throw error
    }

    console.log("Property deleted successfully")

    // Revalidate relevant paths
    revalidatePath("/dashboard")

    console.log("=== Delete Property Process Completed ===")
    return { success: true }
  } catch (error) {
    console.error("Delete property error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete property",
    }
  }
}

export interface PropertyStats {
  totalProperties: number
  averageRiskScore: number
  highRiskCount: number
  totalRevenue: number
  propertyChangeLastMonth: number
  riskChangeLastMonth: number
  highRiskChangeLastMonth: number
  revenueChangeLastMonth: number
}

export async function getPropertyStats(
  userId: string,
): Promise<PropertyStats | null> {
  try {
    console.log("=== Get Property Stats Started ===")
    const supabase = await createServerClientFromEnv()

    // Get current date for monthly comparisons
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    )

    // Get all properties for this user
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
      .eq("user_id", userId)
      .eq("is_active", true)

    if (propertiesError) {
      throw propertiesError
    }

    // Get properties created last month for change calculation
    const { data: lastMonthProperties, error: lastMonthError } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("created_at", firstDayOfLastMonth.toISOString())
      .lt("created_at", firstDayOfMonth.toISOString())

    if (lastMonthError) {
      throw lastMonthError
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

    // Calculate month-over-month changes
    const propertyChangeLastMonth = lastMonthProperties?.length || 0

    // For this example, we're using simple change calculations
    // In a real app, you'd want to get historical data for more accurate trends
    const riskChangeLastMonth = -3 // Placeholder: Would calculate from historical data
    const highRiskChangeLastMonth = 0 // Placeholder: Would calculate from historical data
    const revenueChangeLastMonth = 12 // Placeholder: Would calculate from historical data

    console.log("=== Get Property Stats Completed ===")

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
    console.error("Get property stats error:", error)
    return null
  }
}
