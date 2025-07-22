"use client"

import { useState } from "react"
import type { TenantData } from "../types/tenant"
import { createEmptyTenant, generateSuccessMessage } from "../utils/tenant-utils"

export const useTenantForm = () => {
  const [savedTenants, setSavedTenants] = useState<TenantData[]>([])
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null)
  const [currentTenant, setCurrentTenant] = useState<TenantData>(createEmptyTenant())
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleTenantChange = (field: string, value: string) => {
    setCurrentTenant((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavedTenantChange = (tenantId: string, field: string, value: string) => {
    setSavedTenants((prev) => prev.map((tenant) => (tenant.id === tenantId ? { ...tenant, [field]: value } : tenant)))
  }

  const saveTenant = () => {
    const isEditing = !!editingTenantId

    if (isEditing) {
      setSavedTenants((prev) => prev.map((tenant) => (tenant.id === editingTenantId ? currentTenant : tenant)))
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
  }

  const handleLeaseAgreementUpload = (tenantId: string, file: File) => {
    setSavedTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, leaseAgreementFile: file, leaseAgreementUploaded: true } : tenant,
      ),
    )
  }

  return {
    savedTenants,
    editingTenantId,
    currentTenant,
    showSuccessMessage,
    successMessage,
    handleTenantChange,
    handleSavedTenantChange,
    saveTenant,
    editTenant,
    removeTenant,
    handleLeaseAgreementUpload,
  }
}
