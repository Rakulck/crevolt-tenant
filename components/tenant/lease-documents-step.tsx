"use client"

import type React from "react"

import { Upload, FileText, CheckCircle, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TenantData } from "../../types/tenant"
import { getUploadedCount, getUploadProgress } from "../../utils/tenant-utils"

interface LeaseDocumentsStepProps {
  savedTenants: TenantData[]
  onLeaseAgreementUpload: (tenantId: string, event: React.ChangeEvent<HTMLInputElement>) => void
  onBulkUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function LeaseDocumentsStep({ savedTenants, onLeaseAgreementUpload, onBulkUpload }: LeaseDocumentsStepProps) {
  const uploadedCount = getUploadedCount(savedTenants)
  const uploadProgress = getUploadProgress(savedTenants)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900">Lease Documents</h2>
        <p className="text-slate-600 text-lg">Please review the tenant information below and upload lease agreements</p>
      </div>

      {savedTenants.length > 0 && (
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-slate-700 font-medium">
              Lease Agreements Uploaded: {uploadedCount} of {savedTenants.length}
            </p>
            <Progress value={uploadProgress} className="w-full max-w-md mx-auto h-2" />
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
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
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
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">Tenant Name</th>
                    <th className="text-left p-4 font-medium text-slate-700">Unit Number</th>
                    <th className="text-right p-4 font-medium text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {savedTenants.map((tenant, index) => (
                    <tr key={tenant.id} className={index !== savedTenants.length - 1 ? "border-b" : ""}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {tenant.leaseAgreementUploaded && <CheckCircle className="h-5 w-5 text-green-500" />}
                          <div>
                            <p className="font-medium text-slate-900">{tenant.tenantName || "Unnamed Tenant"}</p>
                            {tenant.leaseAgreementUploaded && tenant.leaseAgreementFile && (
                              <div className="flex items-center space-x-1 text-sm text-slate-600 mt-1">
                                <File className="h-3 w-3" />
                                <span>lease_{tenant.unitNumber}.pdf</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-900">{tenant.unitNumber || "N/A"}</span>
                      </td>
                      <td className="p-4 text-right">
                        <input
                          type="file"
                          id={`lease-upload-${tenant.id}`}
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => onLeaseAgreementUpload(tenant.id, e)}
                          className="hidden"
                        />
                        <Label htmlFor={`lease-upload-${tenant.id}`}>
                          <Button
                            className={
                              tenant.leaseAgreementUploaded
                                ? "bg-transparent text-[#4F46E5] border border-[#4F46E5] hover:bg-[#4F46E5]/10"
                                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                            }
                            variant={tenant.leaseAgreementUploaded ? "outline" : "default"}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {tenant.leaseAgreementUploaded ? "Replace" : "Upload Lease Agreement"}
                            </span>
                          </Button>
                        </Label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants added yet</h3>
          <p className="text-slate-600 mb-4">Go back to the previous step to add tenants first.</p>
        </div>
      )}
    </div>
  )
}
