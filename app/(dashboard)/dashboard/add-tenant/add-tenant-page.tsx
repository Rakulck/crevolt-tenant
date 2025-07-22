"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TenantFormStepper } from "../../../../components/tenant-form-stepper"
import { TenantDataEntry } from "../../../../components/tenant/tenant-data-entry"
import { LeaseDocumentsStep } from "../../../../components/tenant/lease-documents-step"
import { VerifySubmitStep } from "../../../../components/tenant/verify-submit-step"
import { useRouter, useSearchParams } from "next/navigation"
import { useTenantForm } from "../../../../hooks/use-tenant-form"
import { TENANT_STEPS } from "../../../../constants/tenant-constants"

export default function AddTenantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("propertyId")

  const [currentStep, setCurrentStep] = useState(1)
  const [dataEntryMethod, setDataEntryMethod] = useState<"upload" | "manual">("manual")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const {
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
  } = useTenantForm()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      console.log("Bulk upload files:", files)
    }
  }

  const handleLeaseUpload = (tenantId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleLeaseAgreementUpload(tenantId, file)
    }
  }

  const handleNext = () => {
    if (currentStep < TENANT_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("All tenant data:", { savedTenants })
    router.push("/dashboard")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TenantDataEntry
            savedTenants={savedTenants}
            currentTenant={currentTenant}
            editingTenantId={editingTenantId}
            dataEntryMethod={dataEntryMethod}
            uploadedFile={uploadedFile}
            showSuccessMessage={showSuccessMessage}
            successMessage={successMessage}
            onDataEntryMethodChange={setDataEntryMethod}
            onTenantChange={handleTenantChange}
            onSaveTenant={saveTenant}
            onEditTenant={editTenant}
            onRemoveTenant={removeTenant}
            onFileUpload={handleFileUpload}
          />
        )

      case 2:
        return (
          <LeaseDocumentsStep
            savedTenants={savedTenants}
            onLeaseAgreementUpload={handleLeaseUpload}
            onBulkUpload={handleBulkUpload}
          />
        )

      case 3:
        return (
          <VerifySubmitStep
            savedTenants={savedTenants}
            onSavedTenantChange={handleSavedTenantChange}
            onSubmit={handleSubmit}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-[#4F46E5]" />
              <h1 className="text-xl font-semibold text-slate-900">Add Tenant Information</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stepper */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <TenantFormStepper currentStep={currentStep} steps={TENANT_STEPS} />
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">
              Step {currentStep}: {TENANT_STEPS[currentStep - 1]}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Choose how to enter tenant information for your property."}
              {currentStep === 2 && "Upload lease agreements for each tenant."}
              {currentStep === 3 && "Review and verify all tenant information before submitting."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Save as Draft
                </Button>

                {currentStep < TENANT_STEPS.length ? (
                  <Button onClick={handleNext} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
