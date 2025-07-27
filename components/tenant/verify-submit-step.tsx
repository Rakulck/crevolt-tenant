"use client"

import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  EMPLOYMENT_STATUS_OPTIONS,
  LEASE_TYPE_OPTIONS,
  PET_OWNERSHIP_OPTIONS,
  UTILITY_INCLUSION_OPTIONS,
} from "../../constants/tenant-constants"

import type { TenantData } from "../../types/tenant"

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
          <p className="mt-2 text-lg text-slate-600">
            Review and verify all tenant information before submitting
          </p>
        </div>
        <Button
          onClick={onSubmit}
          className="bg-[#4F46E5] px-8 text-white hover:bg-[#4338CA]"
        >
          Submit All Tenants
        </Button>
      </div>

      {savedTenants.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="min-w-[160px] p-4 text-left font-semibold text-slate-700">
                      Tenant Name
                    </th>
                    <th className="min-w-[120px] p-4 text-left font-semibold text-slate-700">
                      Unit Number
                    </th>
                    <th className="min-w-[140px] p-4 text-left font-semibold text-slate-700">
                      SSN
                    </th>
                    <th className="min-w-[150px] p-4 text-left font-semibold text-slate-700">
                      Monthly Income
                    </th>
                    <th className="min-w-[150px] p-4 text-left font-semibold text-slate-700">
                      Annual Income
                    </th>
                    <th className="min-w-[120px] p-4 text-left font-semibold text-slate-700">
                      Household Size
                    </th>
                    <th className="min-w-[160px] p-4 text-left font-semibold text-slate-700">
                      Employment Status
                    </th>
                    <th className="min-w-[140px] p-4 text-left font-semibold text-slate-700">
                      Job Title
                    </th>
                    <th className="min-w-[140px] p-4 text-left font-semibold text-slate-700">
                      Industry
                    </th>
                    <th className="min-w-[150px] p-4 text-left font-semibold text-slate-700">
                      Lease Start Date
                    </th>
                    <th className="min-w-[150px] p-4 text-left font-semibold text-slate-700">
                      Lease End Date
                    </th>
                    <th className="min-w-[160px] p-4 text-left font-semibold text-slate-700">
                      Lease Type
                    </th>
                    <th className="min-w-[160px] p-4 text-left font-semibold text-slate-700">
                      Utility Preference
                    </th>
                    <th className="min-w-[140px] p-4 text-left font-semibold text-slate-700">
                      Pet Ownership
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savedTenants.map((tenant, index) => (
                    <tr
                      key={tenant.id}
                      className={`${
                        index !== savedTenants.length - 1 ? "border-b" : ""
                      } hover:bg-slate-50`}
                    >
                      {/* Tenant Name */}
                      <td className="p-4">
                        <Input
                          value={tenant.tenantName}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "tenantName",
                              e.target.value,
                            )
                          }
                          placeholder="Tenant Name"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Unit Number */}
                      <td className="p-4">
                        <Input
                          value={tenant.unitNumber}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "unitNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Unit"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* SSN */}
                      <td className="p-4">
                        <Input
                          value={tenant.ssn}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "ssn",
                              e.target.value,
                            )
                          }
                          placeholder="123-45-6789"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Monthly Income */}
                      <td className="p-4">
                        <Input
                          type="number"
                          value={tenant.statedMonthlyIncome}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "statedMonthlyIncome",
                              e.target.value,
                            )
                          }
                          placeholder="5000"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Annual Income */}
                      <td className="p-4">
                        <Input
                          type="number"
                          value={tenant.statedAnnualIncome}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "statedAnnualIncome",
                              e.target.value,
                            )
                          }
                          placeholder="60000"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Household Size */}
                      <td className="p-4">
                        <Input
                          type="number"
                          min="1"
                          value={tenant.householdSize}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "householdSize",
                              e.target.value,
                            )
                          }
                          placeholder="2"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Employment Status */}
                      <td className="p-4">
                        <Select
                          value={tenant.employmentStatus}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "employmentStatus",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
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

                      {/* Job Title */}
                      <td className="p-4">
                        <Input
                          value={tenant.jobTitle}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "jobTitle",
                              e.target.value,
                            )
                          }
                          placeholder="Job Title"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Industry */}
                      <td className="p-4">
                        <Input
                          value={tenant.industry}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "industry",
                              e.target.value,
                            )
                          }
                          placeholder="Industry"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Lease Start Date */}
                      <td className="p-4">
                        <Input
                          type="date"
                          value={tenant.leaseStartDate}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "leaseStartDate",
                              e.target.value,
                            )
                          }
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Lease End Date */}
                      <td className="p-4">
                        <Input
                          type="date"
                          value={tenant.leaseEndDate}
                          onChange={(e) =>
                            onSavedTenantChange(
                              tenant.id,
                              "leaseEndDate",
                              e.target.value,
                            )
                          }
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Lease Type */}
                      <td className="p-4">
                        <Select
                          value={tenant.leaseTypePreference}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "leaseTypePreference",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {LEASE_TYPE_OPTIONS.map((option) => (
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

                      {/* Utility Preference */}
                      <td className="p-4">
                        <Select
                          value={tenant.utilityInclusionPreference}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "utilityInclusionPreference",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
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

                      {/* Pet Ownership */}
                      <td className="p-4">
                        <Select
                          value={tenant.petOwnership}
                          onValueChange={(value) =>
                            onSavedTenantChange(
                              tenant.id,
                              "petOwnership",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
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
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="mb-2 text-lg font-medium text-slate-900">
            No tenants added yet
          </h3>
          <p className="mb-4 text-slate-600">
            Go back to the previous steps to add tenants first.
          </p>
        </div>
      )}
    </div>
  )
}
