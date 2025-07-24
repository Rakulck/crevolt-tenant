"use client"

import { useState } from "react"

import { uploadLeaseDocument } from "@/packages/supabase/src/buckets"

import {
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
    handleTenantChange,
    handleSavedTenantChange,
    saveTenant,
    editTenant,
    removeTenant,
    handleLeaseAgreementUpload,
  }
}
