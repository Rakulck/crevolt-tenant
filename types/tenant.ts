export interface TenantData {
  id: string
  tenantName: string
  unitNumber: string
  ssn: string
  statedMonthlyIncome: string
  statedAnnualIncome: string
  householdSize: string
  employmentStatus: string
  jobTitle: string
  industry: string
  leaseStartDate: string
  leaseEndDate: string
  leaseTypePreference: string
  utilityInclusionPreference: string
  petOwnership: string
  leaseAgreementFile?: File | null
  leaseAgreementUploaded?: boolean
}

export interface TenantFormProps {
  tenant: TenantData
  onTenantChange: (field: string, value: string) => void
  onSave: () => void
  isEditing: boolean
}

export interface TenantTabProps {
  tenant: TenantData
  onEdit: (tenantId: string) => void
  onRemove: (tenantId: string) => void
}
