"use client"

import { Building, MapPin, Calendar, TrendingUp, MoreVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface PropertyCardProps {
  id?: string
  name: string
  address?: string
  defaultRisk: number
  lastUpdated?: string
  tenantCount?: number
}

export function PropertyCard({ id, name, address, defaultRisk, lastUpdated, tenantCount }: PropertyCardProps) {
  const router = useRouter()

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="h-5 w-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            </div>

            {address && (
              <div className="flex items-center space-x-2 mb-3 text-slate-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{address}</span>
              </div>
            )}

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700">Default Risk:</span>
                <Badge className={getRiskColor(defaultRisk)}>
                  {defaultRisk}% - {getRiskLevel(defaultRisk)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-600">
              {tenantCount && (
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
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              size="sm"
              onClick={() => router.push(`/dashboard/property-report/${id}`)}
            >
              View Details
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/edit-property/${id}`)}>
                  Edit Property
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Remove Property</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
