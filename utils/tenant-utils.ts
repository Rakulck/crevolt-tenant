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

export const generateSuccessMessage = (tenantName: string, isEditing: boolean): string => {
  const name = tenantName || "Tenant"
  return isEditing ? `${name} updated successfully!` : `${name} added successfully!`
}
