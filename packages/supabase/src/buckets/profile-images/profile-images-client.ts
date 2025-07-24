"use client"

import { createClient } from "@/packages/supabase/src/clients/client"

const BUCKET_NAME = "profile-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (increased from 2MB)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

// Maximum dimensions for profile photos
const MAX_DIMENSIONS = {
  width: 800, // Increased back to 800 for better quality
  height: 800, // Increased back to 800 for better quality
}

// Progressive compression settings
const COMPRESSION_SETTINGS = {
  initialQuality: 0.8,
  minQuality: 0.2, // More aggressive compression if needed
  qualityStep: 0.1,
  maxAttempts: 6, // More attempts for better compression
}

export interface ProfileImageUrls {
  original: string
  thumbnail?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Compress image with progressive quality reduction
 */
async function compressImage(
  file: File,
): Promise<{ data: Blob; type: string }> {
  console.log("=== Starting Image Compression ===")
  console.log("Original file:", {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
  })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      console.log("File read complete")
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = async () => {
        console.log("Image loaded:", {
          originalWidth: img.width,
          originalHeight: img.height,
        })

        const canvas = document.createElement("canvas")

        // Calculate dimensions while maintaining aspect ratio
        let { width, height } = img
        const aspectRatio = width / height

        if (width > height) {
          width = Math.min(width, MAX_DIMENSIONS.width)
          height = width / aspectRatio
        } else {
          height = Math.min(height, MAX_DIMENSIONS.height)
          width = height * aspectRatio
        }

        console.log("Resized dimensions:", { width, height })

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        // Progressive compression
        const mimeType =
          file.type === "image/jpeg" || file.type === "image/jpg"
            ? "image/jpeg"
            : "image/png"

        let quality = COMPRESSION_SETTINGS.initialQuality
        let attempt = 0
        let compressedBlob: Blob | null = null

        while (attempt < COMPRESSION_SETTINGS.maxAttempts) {
          console.log(
            `Compression attempt ${attempt + 1} with quality ${quality}`,
          )

          // Create blob with current quality
          compressedBlob = await new Promise<Blob>((blobResolve) => {
            canvas.toBlob((blob) => blobResolve(blob!), mimeType, quality)
          })

          if (compressedBlob.size <= MAX_FILE_SIZE) {
            break
          }

          quality = Math.max(
            quality - COMPRESSION_SETTINGS.qualityStep,
            COMPRESSION_SETTINGS.minQuality,
          )
          attempt++
        }

        if (!compressedBlob || compressedBlob.size > MAX_FILE_SIZE) {
          console.error("Failed to compress image to target size:", {
            finalSize: compressedBlob?.size
              ? `${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`
              : "N/A",
            maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
          })
          reject(
            new Error(
              "Could not compress image to required size. Please select a smaller image.",
            ),
          )
          return
        }

        console.log("Compression complete:", {
          originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`,
          finalQuality: quality,
          attempts: attempt + 1,
        })

        console.log("=== Image Compression Completed ===")
        resolve({ data: compressedBlob, type: mimeType })
      }
      img.onerror = (error) => {
        console.error("Image load error:", error)
        reject(error)
      }
    }
    reader.onerror = (error) => {
      console.error("File read error:", error)
      reject(error)
    }
  })
}

/**
 * Upload profile image directly from client
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  existingImagePath?: string,
): Promise<UploadResult> {
  try {
    console.log("=== Profile Image Upload Started ===")
    console.log("Validating input...")

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type)
      return {
        success: false,
        error: "Invalid file type. Allowed types: JPG, PNG, WebP, GIF",
      }
    }

    // Validate initial file size
    if (file.size > MAX_FILE_SIZE * 3) {
      // Allow 3x the final limit for compression (15MB max before compression)
      console.error("File too large:", {
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${((MAX_FILE_SIZE * 3) / 1024 / 1024).toFixed(2)}MB`,
      })
      return {
        success: false,
        error: "File too large. Please select an image smaller than 15MB.",
      }
    }

    console.log("Starting image compression...")
    // Compress image
    const { data: compressedImage, type: mimeType } = await compressImage(file)

    // Validate compressed size
    if (compressedImage.size > MAX_FILE_SIZE) {
      console.error("Compressed file still too large:", {
        size: `${(compressedImage.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      })
      return {
        success: false,
        error:
          "Image too large after compression. Please select a smaller image.",
      }
    }

    console.log("Initializing upload...")
    const supabase = createClient()

    // Use a consistent filename instead of timestamp-based
    const filePath = `${userId}/profile-photos/profile.${mimeType.split("/")[1]}`
    console.log("Upload path:", filePath)

    // If there's an existing image with a different path, delete it first
    if (existingImagePath && existingImagePath !== filePath) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([existingImagePath])

      if (deleteError) {
        console.warn("Failed to delete old profile image:", deleteError)
      }
    }

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, compressedImage, {
        contentType: mimeType,
        cacheControl: "0", // No caching for instant updates
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      }
    }

    // Get signed URL
    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 365 * 24 * 60 * 60)

    if (signedUrlError || !data?.signedUrl) {
      console.error("Signed URL error:", signedUrlError)
      return {
        success: false,
        error: "Failed to get image URL",
      }
    }

    // Update profile with new image URL immediately
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        profile_image_url: data.signedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Profile update error:", updateError)
      // Don't fail the upload if profile update fails
    }

    console.log("=== Profile Image Upload Completed Successfully ===")
    return {
      success: true,
      url: data.signedUrl,
    }
  } catch (error) {
    console.error("=== Profile Image Upload Failed ===")
    console.error("Error details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
