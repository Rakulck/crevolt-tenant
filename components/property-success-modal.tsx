"use client"

import { CheckCircle, Building2, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PropertySuccessModalProps {
  isOpen: boolean
  onClose: () => void
  propertyName: string
  propertyId: string
}

export function PropertySuccessModal({
  isOpen,
  onClose,
  propertyName,
  propertyId,
}: PropertySuccessModalProps) {
  const router = useRouter()

  const handleReturnToDashboard = () => {
    onClose()
    router.push("/dashboard")
  }

  const handleAddTenant = () => {
    onClose()
    router.push(`/dashboard/add-tenant?propertyId=${propertyId}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Property Added Successfully!
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            <strong>{propertyName}</strong> has been added to your portfolio.
            What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleReturnToDashboard}
            variant="outline"
            className="h-12 w-full bg-transparent"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>

          <Button
            onClick={handleAddTenant}
            className="h-12 w-full bg-[#4F46E5] text-white hover:bg-[#4338CA]"
          >
            <Users className="mr-2 h-4 w-4" />
            Add Tenant Information
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          You can always add tenant information later from the property details
          page.
        </p>
      </DialogContent>
    </Dialog>
  )
}
