"use client"

import { useEffect, useState } from "react"

import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { TenantFormStepper } from "@/components/tenant-form-stepper"
import { LeaseDocumentsStep } from "@/components/tenant/lease-documents-step"
import { TenantDataEntry } from "@/components/tenant/tenant-data-entry"
import { VerifySubmitStep } from "@/components/tenant/verify-submit-step"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenantForm } from "@/hooks/use-tenant-form"
import {
  saveLeaseDocumentMetadata,
  type LeaseDocumentUploadData,
} from "@/packages/supabase/src/buckets"
import { createClient } from "@/packages/supabase/src/clients/client"
import {
  getUserProperties,
  type Property,
} from "@/packages/supabase/src/queries/property"
import {
  createTenantsBulk,
  type CreateTenantData,
} from "@/packages/supabase/src/queries/tenant"
import type { TenantData } from "@/types/tenant"

const TENANT_STEPS = [
  "Tenant Information Entry",
  "Lease Documents",
  "Verify & Submit",
]

export default function AddTenantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyIdFromUrl = searchParams.get("propertyId")

  const [currentStep, setCurrentStep] = useState(1)
  const [dataEntryMethod, setDataEntryMethod] = useState<"upload" | "manual">(
    "manual",
  )
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propertyIdFromUrl || "",
  )
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const {
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
  } = useTenantForm()

  // Load user properties and get current user on component mount
  useEffect(() => {
    async function loadDataAndUser() {
      try {
        // Get current user
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setError("Authentication required. Please log in.")
          return
        }

        setCurrentUser(user)

        // Load properties
        const userProperties = await getUserProperties()
        setProperties(userProperties)
      } catch (error) {
        console.error("Failed to load data:", error)
        setError("Failed to load properties. Please refresh the page.")
      } finally {
        setLoadingProperties(false)
      }
    }

    loadDataAndUser()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // TODO: Implement rent roll parsing
      console.log("File uploaded:", file.name)
    }
  }

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files && selectedPropertyId && currentUser) {
      console.log("Bulk upload:", files)

      // Process each file and match with tenants
      Array.from(files).forEach(async (file) => {
        // Try to match file name to tenant/unit
        // This is a basic implementation - you might want more sophisticated matching
        const fileName = file.name.toLowerCase()

        // Find tenant by checking if filename contains unit number or tenant name
        const matchingTenant = savedTenants.find((tenant) => {
          const unitMatch =
            tenant.unitNumber &&
            fileName.includes(tenant.unitNumber.toLowerCase())
          const nameMatch =
            tenant.tenantName &&
            fileName.includes(
              tenant.tenantName.toLowerCase().replace(/\s+/g, ""),
            )
          return unitMatch || nameMatch
        })

        if (matchingTenant) {
          console.log(
            `Uploading ${file.name} for tenant ${matchingTenant.tenantName}`,
          )
          await handleLeaseAgreementUpload(
            matchingTenant.id,
            file,
            selectedPropertyId,
            currentUser.id,
          )
        } else {
          console.warn(`Could not match file ${file.name} to any tenant`)
          // TODO: Show a dialog for manual tenant assignment
        }
      })
    }
  }

  const handleLeaseUpload = async (
    tenantId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file && selectedPropertyId && currentUser) {
      await handleLeaseAgreementUpload(
        tenantId,
        file,
        selectedPropertyId,
        currentUser.id,
      )
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !selectedPropertyId) {
      setError("Please select a property before proceeding")
      return
    }
    if (currentStep === 1 && savedTenants.length === 0) {
      setError("Please add at least one tenant before proceeding")
      return
    }
    setError(null)
    setCurrentStep((prev) => Math.min(prev + 1, TENANT_STEPS.length))
  }

  const handlePrevious = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const transformTenantData = (tenant: TenantData): CreateTenantData => ({
    tenant_name: tenant.tenantName,
    unit_number: tenant.unitNumber,
    property_id: selectedPropertyId,
    monthly_rent: parseFloat(tenant.statedMonthlyIncome) || 0,
    stated_annual_income: parseFloat(tenant.statedAnnualIncome) || 0,
    lease_start_date: tenant.leaseStartDate || undefined,
    lease_end_date: tenant.leaseEndDate || undefined,
    notes: `Lease Type: ${tenant.leaseTypePreference}\nUtilities: ${tenant.utilityInclusionPreference}\nPets: ${tenant.petOwnership}`,
  })

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      setError("No property selected")
      return
    }

    if (savedTenants.length === 0) {
      setError("No tenants to submit")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Transform tenant data to match database schema
      const tenantsToCreate = savedTenants.map(transformTenantData)

      console.log("Submitting tenants:", tenantsToCreate)

      // Create tenants in database
      const result = await createTenantsBulk(tenantsToCreate)

      if (!result.success) {
        throw new Error(result.error || "Failed to create tenants")
      }

      console.log("Tenants created successfully:", result.data?.length)

      // Now that we have real tenant IDs, save any pending lease documents
      if (result.data && result.data.length > 0) {
        const createdTenants = result.data

        // Match created tenants with pending documents by index
        // This works because we maintain the same order
        for (let i = 0; i < savedTenants.length; i++) {
          const tempTenantId = savedTenants[i].id
          const createdTenant = createdTenants[i]
          const pendingDoc = pendingLeaseDocuments[tempTenantId]

          if (pendingDoc && createdTenant) {
            console.log(
              `Saving lease document metadata for tenant ${createdTenant.id}`,
            )

            // Save metadata with real tenant ID
            const metadataPayload: LeaseDocumentUploadData = {
              tenantId: createdTenant.id,
              propertyId: selectedPropertyId,
              originalFilename: pendingDoc.file.name,
              storagePath: pendingDoc.uploadResult.filePath,
              storageUrl: pendingDoc.uploadResult.url,
              fileSize: pendingDoc.file.size,
              mimeType: pendingDoc.file.type,
            }

            const metadataResult =
              await saveLeaseDocumentMetadata(metadataPayload)

            if (!metadataResult.success) {
              console.error(
                `Failed to save lease document metadata for tenant ${createdTenant.id}:`,
                metadataResult.error,
              )
            }
          }
        }
      }

      // Redirect to dashboard with success message
      router.push("/dashboard?success=tenants-added")
    } catch (error) {
      console.error("Tenant submission error:", error)
      setError(
        error instanceof Error ? error.message : "Failed to submit tenants",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Property Selection */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-900">
                  Select Property
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Choose which property you want to add tenants to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-slate-600">
                      Loading properties...
                    </span>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="property-select">Property *</Label>
                    <Select
                      value={selectedPropertyId}
                      onValueChange={setSelectedPropertyId}
                      disabled={!!propertyIdFromUrl} // Disable if property is pre-selected from URL
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a property..." />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {property.name}
                              </span>
                              <span className="text-sm text-slate-500">
                                {property.address.street_address},{" "}
                                {property.address.city}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {propertyIdFromUrl && (
                      <p className="text-sm text-blue-600">
                        Property pre-selected from previous page
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                    <h3 className="mb-2 text-lg font-medium text-slate-900">
                      No Properties Found
                    </h3>
                    <p className="mb-4 text-slate-600">
                      You need to add a property before you can add tenants.
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/add-property")}
                      className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Add Property First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Data Entry - Only show if property is selected */}
            {selectedPropertyId && (
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
            )}
          </div>
        )

      case 2:
        return (
          <LeaseDocumentsStep
            savedTenants={savedTenants}
            onLeaseAgreementUpload={handleLeaseUpload}
            onBulkUpload={handleBulkUpload}
            uploadingLeases={uploadingLeases}
            uploadErrors={uploadErrors}
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
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-[#4F46E5]" />
              <h1 className="text-xl font-semibold text-slate-900">
                Add Tenant Information
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
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
              {currentStep === 1 &&
                "Choose how to enter tenant information for your property."}
              {currentStep === 2 && "Upload lease agreements for each tenant."}
              {currentStep === 3 &&
                "Review and verify all tenant information before submitting."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Save as Draft
                </Button>

                {currentStep < TENANT_STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Submit"
                    )}
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
