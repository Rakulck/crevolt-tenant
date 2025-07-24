"use client"

import { useState } from "react"

import {
  saveLeaseDocumentMetadata,
  uploadLeaseDocument,
  type LeaseDocumentUploadData,
} from "@/packages/supabase/src/buckets"

interface UseLeaseDocumentsReturn {
  uploading: boolean
  uploadProgress: Record<string, number>
  uploadedDocuments: Record<string, string>
  uploadError: string | null
  uploadLeaseForTenant: (
    file: File,
    tenantId: string,
    propertyId: string,
    userId: string,
  ) => Promise<boolean>
  clearError: () => void
}

export function useLeaseDocuments(): UseLeaseDocumentsReturn {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  )
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, string>
  >({})
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadLeaseForTenant = async (
    file: File,
    tenantId: string,
    propertyId: string,
    userId: string,
  ): Promise<boolean> => {
    try {
      setUploading(true)
      setUploadError(null)
      setUploadProgress((prev) => ({ ...prev, [tenantId]: 0 }))

      console.log("Starting lease document upload for tenant:", tenantId)

      // Step 1: Upload file to storage
      setUploadProgress((prev) => ({ ...prev, [tenantId]: 25 }))
      const uploadResult = await uploadLeaseDocument(
        file,
        tenantId,
        propertyId,
        userId,
      )

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed")
      }

      setUploadProgress((prev) => ({ ...prev, [tenantId]: 75 }))

      // Step 2: Save metadata to database
      const metadataPayload: LeaseDocumentUploadData = {
        tenantId,
        propertyId,
        originalFilename: file.name,
        storagePath: uploadResult.filePath!,
        storageUrl: uploadResult.url!,
        fileSize: file.size,
        mimeType: file.type,
      }

      const metadataResult = await saveLeaseDocumentMetadata(metadataPayload)

      if (!metadataResult.success) {
        throw new Error(
          metadataResult.error || "Failed to save document metadata",
        )
      }

      setUploadProgress((prev) => ({ ...prev, [tenantId]: 100 }))
      setUploadedDocuments((prev) => ({
        ...prev,
        [tenantId]: uploadResult.url!,
      }))

      console.log("Lease document upload completed successfully")
      return true
    } catch (error) {
      console.error("Lease document upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setUploadProgress((prev) => ({ ...prev, [tenantId]: 0 }))
      return false
    } finally {
      setUploading(false)
    }
  }

  const clearError = () => {
    setUploadError(null)
  }

  return {
    uploading,
    uploadProgress,
    uploadedDocuments,
    uploadError,
    uploadLeaseForTenant,
    clearError,
  }
}
