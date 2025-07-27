import type { ExtractedTenantData } from "@/services/rent-roll"

import type { TenantData } from "../types/tenant"

export const createEmptyTenant = (): TenantData => ({
  id: Date.now().toString(),
  tenantName: "",
  unitNumber: "",
  ssn: "",
  statedMonthlyIncome: "",
  statedAnnualIncome: "",
  householdSize: "",
  employmentStatus: "",
  jobTitle: "",
  industry: "",
  leaseStartDate: "",
  leaseEndDate: "",
  leaseTypePreference: "",
  utilityInclusionPreference: "",
  petOwnership: "",
  leaseAgreementFile: null,
  leaseAgreementUploaded: false,
})

export const calculateAnnualIncome = (monthlyIncome: string): string => {
  const annual = (Number.parseFloat(monthlyIncome) || 0) * 12
  return annual.toString()
}

export const getUploadedCount = (tenants: TenantData[]): number => {
  return tenants.filter((tenant) => tenant.leaseAgreementUploaded).length
}

export const getUploadProgress = (tenants: TenantData[]): number => {
  if (tenants.length === 0) return 0
  return (getUploadedCount(tenants) / tenants.length) * 100
}

export const generateTenantId = (): string => {
  return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateSuccessMessage = (
  tenantName: string,
  isEditing: boolean,
): string => {
  const name = tenantName || "Tenant"
  return isEditing
    ? `${name} updated successfully!`
    : `${name} added successfully!`
}

export const convertExtractedToCreateTenantData = (
  extractedData: ExtractedTenantData,
  propertyId: string,
) => {
  return {
    property_id: propertyId,
    tenant_name: extractedData.tenantName,
    unit_number: extractedData.unitNumber,
    monthly_rent: extractedData.currentRent || 0,
    lease_start_date: extractedData.leaseStartDate || undefined,
    lease_end_date: extractedData.leaseEndDate || undefined,
    stated_annual_income: extractedData.currentRent
      ? extractedData.currentRent * 12
      : undefined,
    // Additional fields can be filled in later by user
  }
}

export const convertRentRollToTenantData = (extractedData: any): TenantData => {
  return {
    id: extractedData.id,
    tenantName: extractedData.tenantName,
    unitNumber: extractedData.unitNumber,
    ssn: "",
    statedMonthlyIncome: extractedData.currentRent?.toString() || "",
    statedAnnualIncome: extractedData.currentRent
      ? (extractedData.currentRent * 12).toString()
      : "",
    householdSize: "",
    employmentStatus: "",
    jobTitle: "",
    industry: "",
    leaseStartDate: extractedData.leaseStartDate || "",
    leaseEndDate: extractedData.leaseEndDate || "",
    leaseTypePreference: "",
    utilityInclusionPreference: "",
    petOwnership: "",
    leaseAgreementFile: null,
    leaseAgreementUploaded: false,
  }
}
