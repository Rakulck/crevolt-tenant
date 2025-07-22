"use client"
import { ArrowLeft, Building2, Download, FileText, Share } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PropertyData {
  id: string
  name: string
  address: string
  totalUnits: number
  occupiedUnits: number
  averageRisk: number
}

interface TenantRiskData {
  id: string
  tenantName: string
  unitNumber: string
  softCreditPermission: boolean
  defaultProbability: number
}

interface PropertyReportPageProps {
  propertyId: string
}

export default function PropertyReportPage({
  propertyId,
}: PropertyReportPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const [propertyData, setPropertyData] = useState<PropertyData>({
    id: "",
    name: "",
    address: "",
    totalUnits: 0,
    occupiedUnits: 0,
    averageRisk: 0,
  })

  const [tenantRiskData, _setTenantRiskData] = useState<TenantRiskData[]>([
    {
      id: "1",
      tenantName: "Sarah Johnson",
      unitNumber: "A-101",
      softCreditPermission: true,
      defaultProbability: 12.5,
    },
    {
      id: "2",
      tenantName: "Michael Chen",
      unitNumber: "B-205",
      softCreditPermission: false,
      defaultProbability: 34.2,
    },
    {
      id: "3",
      tenantName: "Emily Rodriguez",
      unitNumber: "C-312",
      softCreditPermission: true,
      defaultProbability: 8.7,
    },
    {
      id: "4",
      tenantName: "David Thompson",
      unitNumber: "A-204",
      softCreditPermission: true,
      defaultProbability: 67.8,
    },
    {
      id: "5",
      tenantName: "Lisa Park",
      unitNumber: "D-108",
      softCreditPermission: false,
      defaultProbability: 28.9,
    },
    {
      id: "6",
      tenantName: "Robert Wilson",
      unitNumber: "B-301",
      softCreditPermission: false,
      defaultProbability: 72.1,
    },
    {
      id: "7",
      tenantName: "Amanda Foster",
      unitNumber: "C-407",
      softCreditPermission: true,
      defaultProbability: 15.3,
    },
  ])

  useEffect(() => {
    // Simulate loading property data
    setTimeout(() => {
      setPropertyData({
        id: propertyId,
        name: "Sunset Apartments Complex",
        address: "1234 Sunset Blvd, Los Angeles, CA 90028",
        totalUnits: 24,
        occupiedUnits: 7,
        averageRisk: 34.2,
      })
      setIsLoading(false)
    }, 1000)
  }, [propertyId])

  const getRiskColor = (risk: number) => {
    if (risk <= 15) return "text-green-600"
    if (risk <= 35) return "text-orange-500"
    return "text-red-600"
  }

  const getPermissionColor = (hasPermission: boolean) => {
    return hasPermission ? "text-green-600" : "text-red-600"
  }

  const handleDownloadReport = () => {
    // In a real app, this would generate and download a PDF report
    console.log("Downloading report for property:", propertyId)
  }

  const handleShareReport = () => {
    // In a real app, this would open a share dialog
    console.log("Sharing report for property:", propertyId)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4F46E5]" />
          <p className="text-slate-600">Loading property report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-[#4F46E5]" />
              <h1 className="text-xl font-semibold text-slate-900">
                Property Report
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleShareReport}
              className="bg-transparent"
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              onClick={handleDownloadReport}
              className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Property Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">
              {propertyData.name}
            </CardTitle>
            <CardDescription className="text-lg">
              {propertyData.address}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {propertyData.occupiedUnits}
                </div>
                <div className="text-sm text-slate-600">Occupied Units</div>
                <div className="text-xs text-slate-500">
                  of {propertyData.totalUnits} total
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getRiskColor(propertyData.averageRisk)}`}
                >
                  {propertyData.averageRisk}%
                </div>
                <div className="text-sm text-slate-600">Average Risk</div>
                <div className="text-xs text-slate-500">across all tenants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {Math.round(
                    (propertyData.occupiedUnits / propertyData.totalUnits) * 100
                  )}
                  %
                </div>
                <div className="text-sm text-slate-600">Occupancy Rate</div>
                <div className="text-xs text-slate-500">current occupancy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Risk Analysis Dashboard */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-slate-700 px-6 py-4 text-white">
              <h2 className="text-center text-xl font-semibold">
                Tenant Risk Analysis Dashboard
              </h2>
            </div>

            {/* Table Header */}
            <div className="bg-slate-600 px-6 py-3 text-white">
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">Tenant Name</div>
                <div className="font-medium">Unit Number</div>
                <div className="font-medium">Soft Credit Permission</div>
                <div className="font-medium">Default Probability</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-200">
              {tenantRiskData.map((tenant, index) => (
                <div
                  key={tenant.id}
                  className={`px-6 py-4 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} transition-colors hover:bg-slate-100`}
                >
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium text-slate-900">
                      {tenant.tenantName}
                    </div>
                    <div className="text-slate-600">{tenant.unitNumber}</div>
                    <div
                      className={`font-semibold ${getPermissionColor(tenant.softCreditPermission)}`}
                    >
                      {tenant.softCreditPermission ? "YES" : "NO"}
                    </div>
                    <div
                      className={`text-lg font-bold ${getRiskColor(tenant.defaultProbability)}`}
                    >
                      {tenant.defaultProbability}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mt-6 border-slate-200 bg-slate-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5]/10">
                  <FileText className="h-4 w-4 text-[#4F46E5]" />
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-medium text-slate-900">
                  Risk Analysis Notes
                </h4>
                <p className="mb-3 text-sm text-slate-600">
                  This report shows the default probability for each tenant
                  based on their credit history, income verification, and other
                  risk factors. Tenants with soft credit permission have agreed
                  to credit checks, which generally results in more accurate
                  risk assessments.
                </p>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>• Green: Low Risk (0-15%)</span>
                  <span>• Orange: Medium Risk (16-35%)</span>
                  <span>• Red: High Risk (36%+)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
