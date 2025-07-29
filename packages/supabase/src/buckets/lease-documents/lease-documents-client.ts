"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

const BUCKET_NAME = "lease-documents"
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]

export interface UploadResult {
  success: boolean
  url?: string
  filePath?: string
  error?: string
}

export interface LeaseDocumentData {
  tenantId: string
  propertyId: string
  originalFilename: string
  fileSize: number
  mimeType: string
  storageUrl: string
  storagePath: string
}

/**
 * Upload a lease document for a specific tenant
 */
export async function uploadLeaseDocument(
  file: File,
  tenantId: string,
  propertyId: string,
  userId: string,
): Promise<UploadResult> {
  try {
    console.log("=== Lease Document Upload Started ===")
    console.log("File details:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      tenantId,
      propertyId,
    })

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type)
      return {
        success: false,
        error: `Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG, WebP`,
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", {
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      })
      return {
        success: false,
        error: `File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      }
    }

    const supabase = createClient()

    // Create unique file path: userId/propertyId/tenantId/lease_document_timestamp.ext
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileExtension = file.name.split(".").pop() || "pdf"
    const filePath = `${userId}/${propertyId}/${tenantId}/lease_${timestamp}.${fileExtension}`

    console.log("Uploading to path:", filePath)

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "0", // No caching for security
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      }
    }

    // Get signed URL for the uploaded file (valid for 7 days)
    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60) // 7 days

    if (signedUrlError || !data?.signedUrl) {
      console.error("Signed URL error:", signedUrlError)
      return {
        success: false,
        error: "Failed to get document URL",
      }
    }

    console.log("=== Lease Document Upload Completed ===")
    return {
      success: true,
      url: data.signedUrl,
      filePath,
    }
  } catch (error) {
    console.error("=== Lease Document Upload Failed ===")
    console.error("Error details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

/**
 * Get signed URL for an existing lease document
 */
export async function getLeaseDocumentUrl(
  filePath: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60, // 7 days default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresInSeconds)

    if (error || !data?.signedUrl) {
      return {
        success: false,
        error: error?.message || "Failed to get signed URL",
      }
    }

    return {
      success: true,
      url: data.signedUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get URL",
    }
  }
}

/**
 * Delete a lease document
 */
export async function deleteLeaseDocument(
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
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    }
  }
}
