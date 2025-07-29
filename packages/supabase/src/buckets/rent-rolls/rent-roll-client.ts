"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

const BUCKET_NAME = "rent-rolls"
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
  "application/pdf", // .pdf
  "application/vnd.apple.numbers", // Apple Numbers
]

export interface RentRollUploadResult {
  success: boolean
  url?: string
  filePath?: string
  fileId?: string
  error?: string
}

export interface RentRollMetadata {
  propertyId: string
  userId: string
  originalFilename: string
  fileSize: number
  mimeType: string
  processedData?: {
    totalUnits: number
    extractedTenants: number
    processingTimeMs: number
  }
}

/**
 * Upload a rent roll file to Supabase storage
 */
export async function uploadRentRollFile(
  file: File,
  metadata: RentRollMetadata,
  options: {
    onProgress?: (percent: number) => void
  } = {},
): Promise<RentRollUploadResult> {
  try {
    console.log("🔄 [RentRollStorage] Upload started:", {
      filename: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      propertyId: metadata.propertyId,
    })

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error("❌ [RentRollStorage] Invalid file type:", file.type)
      return {
        success: false,
        error: `Invalid file type. Allowed types: Excel (.xlsx, .xls), CSV, PDF`,
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error("❌ [RentRollStorage] File too large:", {
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      })
      return {
        success: false,
        error: `File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      }
    }

    const supabase = createClient()

    // Create unique file path: userId/propertyId/rent_roll_timestamp.ext
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileExtension = file.name.split(".").pop() || "xlsx"
    const cleanFilename = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
    const filePath = `${metadata.userId}/${metadata.propertyId}/rent_roll_${cleanFilename}_${timestamp}.${fileExtension}`

    console.log("📁 [RentRollStorage] Uploading to path:", filePath)

    // Simulate upload progress (since Supabase doesn't provide progress events)
    let uploadProgress = 0
    const progressInterval = setInterval(() => {
      uploadProgress = Math.min(95, uploadProgress + 5)
      options.onProgress?.(uploadProgress)
    }, 100)

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "0", // No caching for security
          upsert: false, // Don't overwrite existing files
        })

      clearInterval(progressInterval)
      options.onProgress?.(100) // Complete progress

      if (uploadError) {
        console.error("❌ [RentRollStorage] Upload error:", uploadError)
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        }
      }

      // Get signed URL for the uploaded file (valid for 30 days)
      const { data, error: signedUrlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 30 * 24 * 60 * 60) // 30 days

      if (signedUrlError || !data?.signedUrl) {
        console.error("❌ [RentRollStorage] Signed URL error:", signedUrlError)
        return {
          success: false,
          error: "Failed to get document URL",
        }
      }

      console.log("✅ [RentRollStorage] Upload completed successfully")
      return {
        success: true,
        url: data.signedUrl,
        filePath,
      }
    } catch (error) {
      clearInterval(progressInterval)
      throw error
    }
  } catch (error) {
    console.error("💥 [RentRollStorage] Upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

/**
 * Delete a rent roll file from storage
 */
export async function deleteRentRollFile(
  filePath: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    }
  }
}

/**
 * Get signed URL for an existing rent roll file
 */
export async function getRentRollFileUrl(
  filePath: string,
  expiresIn: number = 24 * 60 * 60, // 24 hours default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error || !data?.signedUrl) {
      return {
        success: false,
        error: error?.message || "Failed to generate signed URL",
      }
    }

    return {
      success: true,
      url: data.signedUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "URL generation failed",
    }
  }
}
