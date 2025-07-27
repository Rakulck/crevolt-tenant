"use server"

import { revalidatePath } from "next/cache"

import { createServerClientFromEnv } from "../../clients/server"

const BUCKET_NAME = "profile-images"
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Convert base64 to buffer
 */
function base64ToBuffer(base64: string): Buffer {
  console.log("=== Converting Base64 to Buffer ===")
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")
  console.log(`Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)
  return buffer
}

/**
 * Server action to upload profile image
 * Can be called from client components
 */
export async function uploadProfileImageAction(
  formData: FormData,
): Promise<UploadResult> {
  try {
    console.log("=== Profile Image Upload Started ===")
    console.log("Validating input data...")

    const imageData = formData.get("imageData") as string
    const userId = formData.get("userId") as string
    const mimeType = formData.get("mimeType") as string

    if (!imageData || !userId || !mimeType) {
      console.error("Missing required data:", {
        hasImageData: !!imageData,
        hasUserId: !!userId,
        hasMimeType: !!mimeType,
      })
      return { success: false, error: "Missing required data" }
    }

    console.log("Input validation passed:", {
      userId,
      mimeType,
      imageDataLength: imageData.length,
    })

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      console.error("Invalid mime type:", mimeType)
      return {
        success: false,
        error: "Invalid file type. Allowed types: JPG, PNG, WebP, GIF",
      }
    }

    console.log("Mime type validation passed:", mimeType)

    // Convert base64 to buffer
    const buffer = base64ToBuffer(imageData)

    // Validate file size after compression
    if (buffer.length > MAX_FILE_SIZE) {
      console.error("File too large:", {
        size: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      })
      return {
        success: false,
        error: "File too large. Maximum size: 2MB",
      }
    }

    console.log("Size validation passed:", {
      size: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
    })

    console.log("Initializing Supabase client...")
    const supabase = await createServerClientFromEnv()

    // Generate file path
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "")
    const extension = mimeType.split("/")[1]
    const filePath = `${userId}/profile-photos/${timestamp}.${extension}`
    console.log("Generated file path:", filePath)

    console.log("Starting file upload to bucket:", BUCKET_NAME)
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: "0", // No caching for instant updates
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return {
        success: false,
        error: `Failed to upload: ${uploadError.message}`,
      }
    }

    console.log("File uploaded successfully, generating signed URL...")
    // Get signed URL
    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 365 * 24 * 60 * 60) // 1 year

    if (signedUrlError || !data?.signedUrl) {
      console.error("Signed URL error:", signedUrlError)
      return {
        success: false,
        error: "Failed to generate signed URL",
      }
    }

    console.log("Signed URL generated successfully")

    // Revalidate profile page
    console.log("Revalidating profile page...")
    revalidatePath("/dashboard/profile")

    console.log("=== Profile Image Upload Completed Successfully ===")
    return {
      success: true,
      url: signedUrl,
    }
  } catch (error) {
    console.error("=== Profile Image Upload Failed ===")
    console.error("Unexpected error:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
