import { z } from "zod"

import { createServerClientFromEnv } from "@/packages/supabase/src/clients/server"

const saveRentRollSchema = z.object({
  propertyId: z.string().uuid(),
  originalFilename: z.string().min(1),
  storagePath: z.string().min(1),
  storageUrl: z.string().url(),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  processedData: z
    .object({
      totalUnits: z.number().min(0),
      extractedTenants: z.number().min(0),
      processingTimeMs: z.number().positive(),
      sheets: z
        .array(
          z.object({
            name: z.string(),
            unitsFound: z.number().min(0),
            confidence: z.number().min(0).max(1),
          }),
        )
        .optional(),
    })
    .optional(),
})

export type SaveRentRollData = z.infer<typeof saveRentRollSchema>

export interface RentRollSaveResult {
  success: boolean
  data?: {
    id: string
    filePath: string
    url: string
  }
  error?: string
}

/**
 * Save rent roll metadata to database after successful upload and processing
 */
export async function saveRentRollMetadata(
  uploadData: SaveRentRollData,
): Promise<RentRollSaveResult> {
  try {
    console.log("🔄 [RentRollActions] Saving metadata:", {
      filename: uploadData.originalFilename,
      propertyId: uploadData.propertyId,
      extractedTenants: uploadData.processedData?.extractedTenants,
    })

    // Validate input
    const validatedData = saveRentRollSchema.parse(uploadData)

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Not authenticated")
    }

    // Save to uploaded_files table
    const { data, error } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        property_id: validatedData.propertyId,
        document_type: "rent_roll",
        original_filename: validatedData.originalFilename,
        stored_filename:
          validatedData.storagePath.split("/").pop() ||
          validatedData.originalFilename,
        storage_bucket: "rent-rolls",
        storage_path: validatedData.storagePath,
        storage_url: validatedData.storageUrl,
        file_type: validatedData.mimeType,
        file_size_bytes: validatedData.fileSize,
        file_status: "processed",
        file_metadata: validatedData.processedData
          ? {
              totalUnits: validatedData.processedData.totalUnits,
              extractedTenants: validatedData.processedData.extractedTenants,
              processingTimeMs: validatedData.processedData.processingTimeMs,
              sheets: validatedData.processedData.sheets,
              parsedAt: new Date().toISOString(),
            }
          : null,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ [RentRollActions] Database save error:", error)
      throw error
    }

    console.log("✅ [RentRollActions] Metadata saved successfully:", data.id)

    return {
      success: true,
      data: {
        id: data.id,
        filePath: data.storage_path,
        url: data.storage_url,
      },
    }
  } catch (error) {
    console.error("💥 [RentRollActions] Save failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save metadata",
    }
  }
}

/**
 * Get rent roll files for a property
 */
export async function getPropertyRentRolls(propertyId: string) {
  try {
    const supabase = await createServerClientFromEnv()

    const { data, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("property_id", propertyId)
      .eq("document_type", "rent_roll")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching rent rolls:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch rent rolls",
    }
  }
}

/**
 * Delete rent roll record from database
 */
export async function deleteRentRollRecord(fileId: string) {
  try {
    const supabase = await createServerClientFromEnv()

    const { error } = await supabase
      .from("uploaded_files")
      .update({ is_archived: true, archive_date: new Date().toISOString() })
      .eq("id", fileId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting rent roll record:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete record",
    }
  }
}
