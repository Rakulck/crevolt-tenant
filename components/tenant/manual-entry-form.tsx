"use client"

import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { TenantFormFields } from "./tenant-form-fields"

import type { TenantFormProps } from "../../types/tenant"

export function ManualEntryForm({
  tenant,
  onTenantChange,
  onSave,
  isEditing,
}: TenantFormProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6 rounded-lg border border-[#4F46E5]/20 bg-[#4F46E5]/10 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Check className="mt-0.5 h-5 w-5 text-[#4F46E5]" />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium text-[#4F46E5]">
              Manual Entry
            </h4>
            <p className="text-sm text-[#4F46E5]/80">
              Enter tenant information manually using the form below. Perfect
              for adding individual tenants or when you don't have a rent roll
              file.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {isEditing ? "Edit Tenant" : "Add New Tenant"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update tenant information"
              : "Enter tenant details below"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TenantFormFields tenant={tenant} onTenantChange={onTenantChange} />

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button
              onClick={onSave}
              className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            >
              <Check className="mr-2 h-4 w-4" />
              {isEditing ? "Update Tenant" : "Save Tenant"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
