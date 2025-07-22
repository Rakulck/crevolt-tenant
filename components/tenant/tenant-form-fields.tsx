"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TenantFormProps } from "../../types/tenant"
import {
  EMPLOYMENT_STATUS_OPTIONS,
  LEASE_TYPE_OPTIONS,
  UTILITY_INCLUSION_OPTIONS,
  PET_OWNERSHIP_OPTIONS,
} from "../../constants/tenant-constants"
import { calculateAnnualIncome } from "../../utils/tenant-utils"

export function TenantFormFields({ tenant, onTenantChange }: Omit<TenantFormProps, "onSave" | "isEditing">) {
  const handleMonthlyIncomeChange = (value: string) => {
    onTenantChange("statedMonthlyIncome", value)
    const annual = calculateAnnualIncome(value)
    onTenantChange("statedAnnualIncome", annual)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="tenant-name">Tenant Name</Label>
        <Input
          id="tenant-name"
          value={tenant.tenantName}
          onChange={(e) => onTenantChange("tenantName", e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit-number">Unit Number</Label>
        <Input
          id="unit-number"
          value={tenant.unitNumber}
          onChange={(e) => onTenantChange("unitNumber", e.target.value)}
          placeholder="4B"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ssn">SSN</Label>
        <Input
          id="ssn"
          value={tenant.ssn}
          onChange={(e) => onTenantChange("ssn", e.target.value)}
          placeholder="123-45-6789"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly-income">Stated Monthly Income ($)</Label>
        <Input
          id="monthly-income"
          type="number"
          value={tenant.statedMonthlyIncome}
          onChange={(e) => handleMonthlyIncomeChange(e.target.value)}
          placeholder="5000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="household-size">Household Size</Label>
        <Input
          id="household-size"
          type="number"
          min="1"
          value={tenant.householdSize}
          onChange={(e) => onTenantChange("householdSize", e.target.value)}
          placeholder="2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employment-status">Employment Status</Label>
        <Select value={tenant.employmentStatus} onValueChange={(value) => onTenantChange("employmentStatus", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Employment Status" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-title">Job Title</Label>
        <Input
          id="job-title"
          value={tenant.jobTitle}
          onChange={(e) => onTenantChange("jobTitle", e.target.value)}
          placeholder="Software Engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          value={tenant.industry}
          onChange={(e) => onTenantChange("industry", e.target.value)}
          placeholder="Technology"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lease-type">Lease Type Preference</Label>
        <Select
          value={tenant.leaseTypePreference}
          onValueChange={(value) => onTenantChange("leaseTypePreference", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Lease Type" />
          </SelectTrigger>
          <SelectContent>
            {LEASE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="utility-preference">Utility Inclusion Preference</Label>
        <Select
          value={tenant.utilityInclusionPreference}
          onValueChange={(value) => onTenantChange("utilityInclusionPreference", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Utility Preference" />
          </SelectTrigger>
          <SelectContent>
            {UTILITY_INCLUSION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pet-ownership">Pet Ownership</Label>
        <Select value={tenant.petOwnership} onValueChange={(value) => onTenantChange("petOwnership", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Pet Status" />
          </SelectTrigger>
          <SelectContent>
            {PET_OWNERSHIP_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
