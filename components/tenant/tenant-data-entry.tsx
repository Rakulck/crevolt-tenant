"use client"

import type React from "react"

import { FileText } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TenantTab } from "../tenant-tab"

import { ManualEntryForm } from "./manual-entry-form"
import { RentRollUpload } from "./rent-roll-upload"
import { SuccessMessage } from "./success-message"

import type { TenantData } from "../../types/tenant"

interface TenantDataEntryProps {
  savedTenants: TenantData[]
  currentTenant: TenantData
  editingTenantId: string | null
  dataEntryMethod: "upload" | "manual"
  uploadedFile: File | null
  showSuccessMessage: boolean
  successMessage: string
  processingRentRoll?: boolean
  rentRollErrors?: string[]
  uploadProgress?: {
    stage: "processing" | "uploading" | "complete"
    percent: number
    message: string
  }
  onDataEntryMethodChange: (method: "upload" | "manual") => void
  onTenantChange: (field: string, value: string) => void
  onSaveTenant: () => void
  onEditTenant: (tenantId: string) => void
  onRemoveTenant: (tenantId: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function TenantDataEntry({
  savedTenants,
  currentTenant,
  editingTenantId,
  dataEntryMethod,
  uploadedFile,
  showSuccessMessage,
  successMessage,
  processingRentRoll = false,
  rentRollErrors = [],
  uploadProgress,
  onDataEntryMethodChange,
  onTenantChange,
  onSaveTenant,
  onEditTenant,
  onRemoveTenant,
  onFileUpload,
}: TenantDataEntryProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center space-x-2">
        <FileText className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Tenant Data Entry
        </h3>
      </div>

      {/* Saved Tenants Tabs */}
      {savedTenants.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            Added Tenants ({savedTenants.length})
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {savedTenants.map((tenant) => (
              <TenantTab
                key={tenant.id}
                tenant={tenant}
                onEdit={onEditTenant}
                onRemove={onRemoveTenant}
              />
            ))}
          </div>
        </div>
      )}

      <Tabs
        value={dataEntryMethod}
        onValueChange={(value: string) =>
          onDataEntryMethodChange(value as "manual" | "upload")
        }
      >
        <div className="mb-4 text-center">
          <p className="text-sm text-slate-600">
            Choose your preferred method for entering tenant information
          </p>
        </div>

        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Rent Roll</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
        />

        <TabsContent value="upload">
          <RentRollUpload
            uploadedFile={uploadedFile}
            onFileUpload={onFileUpload}
            isProcessing={processingRentRoll}
            errors={rentRollErrors}
            progress={uploadProgress}
          />
        </TabsContent>

        <TabsContent value="manual">
          <ManualEntryForm
            tenant={currentTenant}
            onTenantChange={onTenantChange}
            onSave={onSaveTenant}
            isEditing={!!editingTenantId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
