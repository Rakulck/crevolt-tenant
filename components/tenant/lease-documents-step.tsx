"use client"

import type React from "react"

import {
  AlertCircle,
  CheckCircle,
  File,
  FileText,
  Loader2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

import { getUploadedCount, getUploadProgress } from "../../utils/tenant-utils"

import type { TenantData } from "../../types/tenant"

interface LeaseDocumentsStepProps {
  savedTenants: TenantData[]
  onLeaseAgreementUpload: (
    tenantId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void
  onBulkUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  uploadingLeases?: Record<string, boolean>
  uploadErrors?: Record<string, string>
}

export function LeaseDocumentsStep({
  savedTenants,
  onLeaseAgreementUpload,
  onBulkUpload,
  uploadingLeases = {},
  uploadErrors = {},
}: LeaseDocumentsStepProps) {
  const uploadedCount = getUploadedCount(savedTenants)
  const uploadProgress = getUploadProgress(savedTenants)

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Lease Documents</h2>
        <p className="text-lg text-slate-600">
          Please review the tenant information below and upload lease agreements
        </p>
      </div>

      {savedTenants.length > 0 && (
        <div className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="font-medium text-slate-700">
              Lease Agreements Uploaded: {uploadedCount} of{" "}
              {savedTenants.length}
            </p>
            <Progress
              value={uploadProgress}
              className="mx-auto h-2 w-full max-w-md"
            />
          </div>

          <div className="flex justify-end">
            <input
              type="file"
              id="bulk-upload"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={onBulkUpload}
              className="hidden"
            />
            <Label htmlFor="bulk-upload">
              <Button
                className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload Lease Agreements
                </span>
              </Button>
            </Label>
          </div>
        </div>
      )}

      {savedTenants.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="p-4 text-left font-medium text-slate-700">
                      Tenant Name
                    </th>
                    <th className="p-4 text-left font-medium text-slate-700">
                      Unit Number
                    </th>
                    <th className="p-4 text-right font-medium text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savedTenants.map((tenant, index) => {
                    const isUploading = uploadingLeases[tenant.id] || false
                    const uploadError = uploadErrors[tenant.id]

                    return (
                      <tr
                        key={tenant.id}
                        className={
                          index !== savedTenants.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {isUploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5]" />
                            ) : tenant.leaseAgreementUploaded ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : uploadError ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : null}
                            <div>
                              <p className="font-medium text-slate-900">
                                {tenant.tenantName || "Unnamed Tenant"}
                              </p>
                              {tenant.leaseAgreementUploaded &&
                                tenant.leaseAgreementFile && (
                                  <div className="mt-1 flex items-center space-x-1 text-sm text-slate-600">
                                    <File className="h-3 w-3" />
                                    <span>
                                      {tenant.leaseAgreementFile.name}
                                    </span>
                                  </div>
                                )}
                              {uploadError && (
                                <div className="mt-1 text-sm text-red-600">
                                  {uploadError}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-900">
                            {tenant.unitNumber || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <input
                            type="file"
                            id={`lease-upload-${tenant.id}`}
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                              onLeaseAgreementUpload(tenant.id, e)
                            }
                            className="hidden"
                            disabled={isUploading}
                          />
                          <Label htmlFor={`lease-upload-${tenant.id}`}>
                            <Button
                              className={
                                tenant.leaseAgreementUploaded
                                  ? "border border-[#4F46E5] bg-transparent text-[#4F46E5] hover:bg-[#4F46E5]/10"
                                  : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                              }
                              variant={
                                tenant.leaseAgreementUploaded
                                  ? "outline"
                                  : "default"
                              }
                              disabled={isUploading}
                              asChild
                            >
                              <span>
                                {isUploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {tenant.leaseAgreementUploaded
                                      ? "Replace"
                                      : "Upload Lease Agreement"}
                                  </>
                                )}
                              </span>
                            </Button>
                          </Label>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="mb-2 text-lg font-medium text-slate-900">
            No tenants added yet
          </h3>
          <p className="mb-4 text-slate-600">
            Go back to the previous step to add tenants first.
          </p>
        </div>
      )}
    </div>
  )
}
