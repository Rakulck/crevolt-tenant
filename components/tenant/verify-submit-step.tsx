"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TenantData } from "../../types/tenant"
import {
  EMPLOYMENT_STATUS_OPTIONS,
  UTILITY_INCLUSION_OPTIONS,
  PET_OWNERSHIP_OPTIONS,
} from "../../constants/tenant-constants"

interface VerifySubmitStepProps {
  savedTenants: TenantData[]
  onSavedTenantChange: (tenantId: string, field: string, value: string) => void
  onSubmit: () => void
}

export function VerifySubmitStep({
  savedTenants,
  onSavedTenantChange,
  onSubmit,
}: VerifySubmitStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Verify & Submit</h2>
          <p className="text-slate-600 text-lg mt-2">
            Review tenant information and submit for processing
          </p>
        </div>
        <Button
          onClick={onSubmit}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8"
        >
          Submit
        </Button>
      </div>

      {savedTenants.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[100px]">
                      Unit Number
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[120px]">
                      SSN
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[140px]">
                      Stated Annual Income
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[120px]">
                      Household Size
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[140px]">
                      Employment Status
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[120px]">
                      Job Title
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[100px]">
                      Industry
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[140px]">
                      Lease Start Date
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[140px]">
                      Lease End Date
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[140px]">
                      Utility Inclusion
                    </th>
                    <th className="text-left p-3 font-medium text-slate-700 min-w-[120px]">
                      Pet Ownership
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savedTenants.map((tenant, index) => (
                    <tr
                      key={tenant.id}
                      className={
                        index !== savedTenants.length - 1 ? "border-b" : ""
                      }
                    >
                      <td className="p-3">{tenant.unitNumber || "N/A"}</td>
                      <td className="p-3">
                        <Input
                          value={tenant.ssn}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "ssn",
                              e.target.value
                            )
                          }
                          placeholder="123-45-6789"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={tenant.statedAnnualIncome}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "statedAnnualIncome",
                              e.target.value
                            )
                          }
                          placeholder="65000"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">{tenant.householdSize || "N/A"}</td>
                      <td className="p-3">
                        <Select
                          value={tenant.employmentStatus}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "employmentStatus",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Input
                          value={tenant.jobTitle}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "jobTitle",
                              e.target.value
                            )
                          }
                          placeholder="Job Title"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={tenant.industry}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "industry",
                              e.target.value
                            )
                          }
                          placeholder="Industry"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="date"
                          value={tenant.leaseStartDate}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "leaseStartDate",
                              e.target.value
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="date"
                          value={tenant.leaseEndDate}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "leaseEndDate",
                              e.target.value
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={tenant.utilityInclusionPreference}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "utilityInclusionPreference",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {UTILITY_INCLUSION_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={tenant.petOwnership}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "petOwnership",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PET_OWNERSHIP_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No tenants added yet
          </h3>
          <p className="text-slate-600 mb-4">
            Go back to the previous steps to add tenants first.
          </p>
        </div>
      )}
    </div>
  )
}
