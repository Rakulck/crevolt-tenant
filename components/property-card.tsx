"use client"

import { useState } from "react"

import {
  Building,
  Calendar,
  MapPin,
  MoreVertical,
  Trash2,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteProperty } from "@/packages/supabase/src/queries/property"

interface PropertyCardProps {
  id?: string
  name: string
  address?: string
  defaultRisk: number
  lastUpdated?: string
  tenantCount?: number
  onPropertyDeleted?: () => void
}

export function PropertyCard({
  id,
  name,
  address,
  defaultRisk,
  lastUpdated,
  tenantCount,
  onPropertyDeleted,
}: PropertyCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getRiskColor = (risk: number) => {
    if (risk <= 10) return "bg-green-100 text-green-800"
    if (risk <= 20) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getRiskLevel = (risk: number) => {
    if (risk <= 10) return "Low"
    if (risk <= 20) return "Medium"
    return "High"
  }

  const handleDeleteProperty = async () => {
    if (!id) return

    setIsDeleting(true)
    setShowDeleteDialog(false)

    try {
      const result = await deleteProperty(id)

      if (result.success) {
        // Call the callback to refresh the properties list
        if (onPropertyDeleted) {
          onPropertyDeleted()
        }
        // Show success message
        alert("Property deleted successfully!")
      } else {
        throw new Error(result.error || "Failed to delete property")
      }
    } catch (error) {
      console.error("Delete property error:", error)
      alert(
        `Failed to delete property: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <Building className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
              </div>

              {address && (
                <div className="mb-3 flex items-center space-x-2 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{address}</span>
                </div>
              )}

              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">
                    Default Risk:
                  </span>
                  <Badge className={getRiskColor(defaultRisk)}>
                    {defaultRisk}% - {getRiskLevel(defaultRisk)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-600">
                {tenantCount !== undefined && tenantCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{tenantCount} tenants</span>
                  </div>
                )}
                {lastUpdated && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {lastUpdated}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                size="sm"
                onClick={() => router.push(`/dashboard/property-report/${id}`)}
                disabled={isDeleting}
              >
                View Details
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isDeleting}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/edit-property/${id}`)
                    }
                    disabled={isDeleting}
                  >
                    Edit Property
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Remove Property"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Property
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Are you sure you want to delete{" "}
              <span className="font-semibold">"{name}"</span>?
              <br />
              <br />
              <span className="text-red-600">
                This action cannot be undone and will permanently remove:
              </span>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>The property and all its information</li>
                <li>All associated tenants and their data</li>
                <li>All lease documents and risk assessments</li>
                <li>All historical analysis reports</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Property
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
