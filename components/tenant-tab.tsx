"use client"

import { Edit, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface TenantData {
  id: string
  tenantName: string
  unitNumber: string
  statedMonthlyIncome: string
  householdSize: string
  employmentStatus: string
  leaseTypePreference: string
  utilityInclusionPreference: string
  petOwnership: string
}

interface TenantTabProps {
  tenant: TenantData
  onEdit: (tenantId: string) => void
  onRemove: (tenantId: string) => void
}

export function TenantTab({ tenant, onEdit, onRemove }: TenantTabProps) {
  return (
    <Card className="p-3 bg-[#4F46E5]/10 border-[#4F46E5]/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#4F46E5]/20 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-[#4F46E5]" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">
              {tenant.tenantName || "Unnamed Tenant"}
            </h4>
            <p className="text-sm text-slate-600">
              Unit: {tenant.unitNumber || "N/A"} • Income: $
              {tenant.statedMonthlyIncome || "0"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tenant.id)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-[#4F46E5] hover:bg-[#4F46E5]/10"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(tenant.id)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-100"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
