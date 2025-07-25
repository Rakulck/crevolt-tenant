"use client"

import { useState } from "react"

import {
  uploadLeaseDocument,
  uploadRentRollFile,
  type RentRollMetadata,
} from "@/packages/supabase/src/buckets"
import { createClient } from "@/packages/supabase/src/clients/client"
import { deleteTenant } from "@/packages/supabase/src/queries/tenant"
import {
  RentRollProcessorService,
  type ExtractedTenantData,
} from "@/services/rent-roll"

import {
  convertRentRollToTenantData,
  createEmptyTenant,
  generateSuccessMessage,
} from "../utils/tenant-utils"

import type { TenantData } from "../types/tenant"

interface PendingLeaseDocument {
  file: File
  uploadResult: {
    url: string
    filePath: string
  }
}

export const useTenantForm = () => {
  const [savedTenants, setSavedTenants] = useState<TenantData[]>([])
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null)
  const [currentTenant, setCurrentTenant] =
    useState<TenantData>(createEmptyTenant())
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [uploadingLeases, setUploadingLeases] = useState<
    Record<string, boolean>
  >({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [pendingLeaseDocuments, setPendingLeaseDocuments] = useState<
    Record<string, PendingLeaseDocument>
  >({})

  // Rent roll processing state
  const [processingRentRoll, setProcessingRentRoll] = useState(false)
  const [rentRollErrors, setRentRollErrors] = useState<string[]>([])
  const [extractedTenants, setExtractedTenants] = useState<
    ExtractedTenantData[]
  >([])
  const [uploadProgress, setUploadProgress] = useState<
    | {
        stage: "processing" | "uploading" | "complete"
        percent: number
        message: string
      }
    | undefined
  >(undefined)

  // 🆕 Two-Stage Commit Pattern - Staging system
  const [stagedTenants, setStagedTenants] = useState<{
    extractedData: ExtractedTenantData[]
    savedToDatabase: boolean
    databaseIds?: string[] // Track DB IDs for cleanup
    uploadSession?: string // Unique session ID for this upload
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleTenantChange = (field: string, value: string) => {
    setCurrentTenant((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavedTenantChange = (
    tenantId: string,
    field: string,
    value: string,
  ) => {
    setSavedTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, [field]: value } : tenant,
      ),
    )
  }

  const handleRentRollUpload = async (
    file: File,
    propertyId?: string,
    _userId?: string, // Unused, we get it from auth
  ) => {
    try {
      setProcessingRentRoll(true)
      setRentRollErrors([])

      // 🎯 SENIOR ENGINEER TIP: Validate file size early
      const MAX_PROCESSING_SIZE = 10 * 1024 * 1024 // 10MB limit for client-side processing

      if (file.size > MAX_PROCESSING_SIZE) {
        setRentRollErrors([
          `File too large for immediate processing (${(file.size / 1024 / 1024).toFixed(2)}MB). ` +
            `Please use files smaller than ${MAX_PROCESSING_SIZE / 1024 / 1024}MB or contact support for bulk uploads.`,
        ])
        return false
      }

      console.log(
        "🔄 [TenantForm] Starting rent roll upload and processing:",
        file.name,
        `(${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      )

      // Step 1: Process the file to extract tenant data
      console.log("📊 [TenantForm] Processing rent roll file...")
      setUploadProgress({
        stage: "processing",
        percent: 0,
        message: "Starting rent roll analysis...",
      })

      const processingResult = await RentRollProcessorService.processFile(
        file,
        {
          onProgress: (processed, total, stage) => {
            const percent = Math.round((processed / total) * 100)
            setUploadProgress({
              stage: "processing",
              percent,
              message:
                stage === "headers"
                  ? `Analyzing column headers (${percent}%)`
                  : `Extracting tenant data (${percent}%)`,
            })
          },
        },
      )

      if (
        !processingResult.success ||
        processingResult.extractedTenants.length === 0
      ) {
        setRentRollErrors(
          processingResult.errors.length > 0
            ? processingResult.errors
            : ["No tenant data found in the file"],
        )
        return false
      }

      // 🎯 SENIOR ENGINEER TIP: Only upload if processing succeeds
      // This prevents storing "bad" files
      console.log(
        "✅ [TenantForm] Processing successful, proceeding with storage...",
      )

      // Step 2: Upload file to Supabase storage (if propertyId provided)
      let storageResult = null
      if (propertyId) {
        // Get current user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.warn("⚠️ [TenantForm] No authenticated user found")
        } else {
          console.log("📤 [TenantForm] Uploading to Supabase storage...")
          const metadata: RentRollMetadata = {
            propertyId,
            userId: user.id,
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            processedData: {
              totalUnits: processingResult.sheets.reduce(
                (sum, sheet) => sum + sheet.data.length,
                0,
              ),
              extractedTenants: processingResult.extractedTenants.length,
              processingTimeMs: processingResult.processingTimeMs,
            },
          }

          setUploadProgress({
            stage: "uploading",
            percent: 0,
            message: "Finalizing data extraction...",
          })

          storageResult = await uploadRentRollFile(file, metadata, {
            onProgress: (percent) => {
              setUploadProgress({
                stage: "uploading",
                percent,
                message: `Finalizing (${percent}%)...`,
              })
            },
          })

          if (!storageResult.success) {
            console.warn(
              "⚠️ [TenantForm] Storage upload failed, continuing with processing only:",
              storageResult.error,
            )
          } else {
            console.log("✅ [TenantForm] File uploaded to storage successfully")
            // Note: Skipping metadata save to database for now
          }
        }
      } else {
        console.log(
          "ℹ️ [TenantForm] No property ID provided - processing only, not storing",
        )
      }

      // Step 4: Extract and store tenants in UI state (no database save)
      console.log("🔄 [TenantForm] Converting extracted data to UI format...")

      // Convert extracted data to UI format for display and editing
      const convertedTenants = processingResult.extractedTenants.map(
        convertRentRollToTenantData,
      )
      setSavedTenants((prev) => [...prev, ...convertedTenants])
      setExtractedTenants(processingResult.extractedTenants)

      // Step 5: Show success message (extraction only, no database save)
      const tenantCount = processingResult.extractedTenants.length
      const message = `Successfully extracted ${tenantCount} tenant${tenantCount > 1 ? "s" : ""} from rent roll`

      setSuccessMessage(message)
      setShowSuccessMessage(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)

      console.log("🎉 [TenantForm] Rent roll extraction completed successfully")
      setUploadProgress({
        stage: "complete",
        percent: 100,
        message: `Successfully extracted ${processingResult.extractedTenants.length} tenants - review and submit to save`,
      })
      return true
    } catch (error) {
      console.error("💥 [TenantForm] Rent roll processing error:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process rent roll"
      setRentRollErrors([errorMessage])
      setUploadProgress(undefined)
      return false
    } finally {
      setProcessingRentRoll(false)
    }
  }

  const handleLeaseAgreementUpload = async (
    tenantId: string,
    file: File,
    propertyId: string,
    userId: string,
  ) => {
    try {
      setUploadingLeases((prev) => ({ ...prev, [tenantId]: true }))
      setUploadErrors((prev) => ({ ...prev, [tenantId]: "" }))

      console.log("Starting lease document upload for tenant:", tenantId)

      // Step 1: Upload file to storage
      const uploadResult = await uploadLeaseDocument(
        file,
        tenantId,
        propertyId,
        userId,
      )

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed")
      }

      console.log("Upload successful, storing temporarily...")

      // Store the upload result to be saved after tenant creation
      setPendingLeaseDocuments((prev) => ({
        ...prev,
        [tenantId]: {
          file,
          uploadResult: {
            url: uploadResult.url!,
            filePath: uploadResult.filePath!,
          },
        },
      }))

      // Update local state to show upload success
      setSavedTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                leaseAgreementFile: file,
                leaseAgreementUploaded: true,
                leaseDocumentUrl: uploadResult.url,
              }
            : tenant,
        ),
      )

      console.log("Lease document stored temporarily")
      return true
    } catch (error) {
      console.error("Lease document upload error:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed"
      setUploadErrors((prev) => ({ ...prev, [tenantId]: errorMessage }))

      // Also update local state to show error
      setSavedTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                leaseAgreementUploaded: false,
                leaseAgreementFile: null,
              }
            : tenant,
        ),
      )
      return false
    } finally {
      setUploadingLeases((prev) => ({ ...prev, [tenantId]: false }))
    }
  }

  // 🆕 Two-Stage Commit Pattern Functions
  const handleCancelUpload = async () => {
    if (stagedTenants?.savedToDatabase && stagedTenants.databaseIds) {
      try {
        console.log("🗑️ [TenantForm] Cleaning up auto-saved tenants...")

        // Delete the auto-saved tenants from database
        for (const tenantId of stagedTenants.databaseIds) {
          const result = await deleteTenant(tenantId)
          if (!result.success) {
            console.error("Failed to delete tenant:", tenantId, result.error)
          }
        }

        console.log("✅ [TenantForm] Cleanup completed")
        setSuccessMessage("Upload cancelled and data cleaned up")
        setShowSuccessMessage(true)
      } catch (error) {
        console.error("💥 [TenantForm] Cleanup error:", error)
        setRentRollErrors(["Failed to cleanup auto-saved data"])
      }
    }

    // Reset all states
    setStagedTenants(null)
    setExtractedTenants([])
    setSavedTenants((prev) =>
      prev.filter(
        (tenant) =>
          !stagedTenants?.extractedData.some(
            (staged) => staged.id === tenant.id,
          ),
      ),
    )
    setUploadProgress(undefined)
    setShowConfirmDialog(false)
  }

  const handleConfirmUpload = () => {
    // User confirms - keep the data
    setStagedTenants(null)
    setShowConfirmDialog(false)
    setSuccessMessage(
      `Successfully confirmed ${stagedTenants?.extractedData.length} tenants from rent roll`,
    )
    setShowSuccessMessage(true)
  }

  const showCancelDialog = () => {
    setShowConfirmDialog(true)
  }

  const saveTenant = () => {
    const isEditing = !!editingTenantId

    if (isEditing) {
      setSavedTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === editingTenantId ? currentTenant : tenant,
        ),
      )
      setEditingTenantId(null)
    } else {
      setSavedTenants((prev) => [...prev, currentTenant])
    }

    // Show success message
    const message = generateSuccessMessage(currentTenant.tenantName, isEditing)
    setSuccessMessage(message)
    setShowSuccessMessage(true)

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)

    // Reset form for new tenant
    setCurrentTenant(createEmptyTenant())
  }

  const editTenant = (tenantId: string) => {
    const tenantToEdit = savedTenants.find((tenant) => tenant.id === tenantId)
    if (tenantToEdit) {
      setCurrentTenant(tenantToEdit)
      setEditingTenantId(tenantId)
    }
  }

  const removeTenant = (tenantId: string) => {
    setSavedTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId))
    if (editingTenantId === tenantId) {
      setEditingTenantId(null)
      setCurrentTenant(createEmptyTenant())
    }
    // Also remove any pending lease documents
    setPendingLeaseDocuments((prev) => {
      const { [tenantId]: _, ...rest } = prev
      return rest
    })
  }

  return {
    savedTenants,
    editingTenantId,
    currentTenant,
    showSuccessMessage,
    successMessage,
    uploadingLeases,
    uploadErrors,
    pendingLeaseDocuments,
    processingRentRoll,
    rentRollErrors,
    extractedTenants,
    uploadProgress,
    handleTenantChange,
    handleSavedTenantChange,
    saveTenant,
    editTenant,
    removeTenant,
    handleLeaseAgreementUpload,
    handleRentRollUpload,
    stagedTenants,
    showConfirmDialog,
    handleCancelUpload,
    handleConfirmUpload,
    showCancelDialog,
  }
}
