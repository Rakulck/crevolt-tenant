"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createServerClientFromEnv } from "@/packages/supabase/src/clients/server"

// Validation schema for lease document upload
const uploadLeaseDocumentSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  propertyId: z.string().uuid("Invalid property ID"),
  originalFilename: z.string().min(1, "Filename is required"),
  storagePath: z.string().min(1, "Storage path is required"),
  storageUrl: z.string().url("Invalid storage URL"),
  fileSize: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
})

export interface LeaseDocumentUploadData {
  tenantId: string
  propertyId: string
  originalFilename: string
  storagePath: string
  storageUrl: string
  fileSize: number
  mimeType: string
}

export interface LeaseDocumentResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Save lease document metadata to database after successful upload
 */
export async function saveLeaseDocumentMetadata(
  uploadData: LeaseDocumentUploadData,
): Promise<LeaseDocumentResult> {
  try {
    console.log("=== Save Lease Document Metadata Started ===")
    console.log("Upload data:", uploadData)

    // Validate input
    const validatedData = uploadLeaseDocumentSchema.parse(uploadData)
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

    console.log("Saving lease document for user:", user.id)

    // Save to uploaded_files table
    const { data, error } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        property_id: validatedData.propertyId,
        tenant_id: validatedData.tenantId,
        document_type: "lease_agreement",
        original_filename: validatedData.originalFilename,
        stored_filename:
          validatedData.storagePath.split("/").pop() ||
          validatedData.originalFilename,
        storage_bucket: "lease-documents",
        storage_path: validatedData.storagePath,
        storage_url: validatedData.storageUrl,
        file_type: validatedData.mimeType,
        file_size_bytes: validatedData.fileSize,
        file_status: "uploaded",
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database save error:", error)
      throw error
    }

    console.log("Lease document metadata saved successfully:", data.id)

    // Revalidate relevant paths
    revalidatePath("/dashboard/add-tenant")
    revalidatePath("/dashboard")

    console.log("=== Save Lease Document Metadata Completed ===")
    return { success: true, data }
  } catch (error) {
    console.error("Save lease document metadata error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save document metadata",
    }
  }
}

/**
 * Get lease documents for a specific tenant
 */
export async function getTenantLeaseDocuments(
  tenantId: string,
): Promise<LeaseDocumentResult> {
  try {
    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Fetch lease documents for the tenant
    const { data, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .eq("document_type", "lease_agreement")
      .eq("file_status", "uploaded")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get tenant lease documents error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch lease documents",
    }
  }
}

/**
 * Get lease documents for a property
 */
export async function getPropertyLeaseDocuments(
  propertyId: string,
): Promise<LeaseDocumentResult> {
  try {
    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Fetch lease documents for the property
    const { data, error } = await supabase
      .from("uploaded_files")
      .select(
        `
        *,
        tenants:tenant_id (
          tenant_name,
          unit_number
        )
      `,
      )
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .eq("document_type", "lease_agreement")
      .eq("file_status", "uploaded")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get property lease documents error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch lease documents",
    }
  }
}

/**
 * Delete a lease document
 */
export async function deleteLeaseDocumentRecord(
  documentId: string,
): Promise<LeaseDocumentResult> {
  try {
    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Delete the document record
    const { error } = await supabase
      .from("uploaded_files")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id)

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard/add-tenant")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Delete lease document record error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete document record",
    }
  }
}
