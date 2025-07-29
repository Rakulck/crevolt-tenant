"use client"
import { useEffect, useState } from "react"

import { ArrowLeft, Building2, Download, FileText, Share } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getPropertyTenantRiskAnalysis,
  type PropertyRiskSummary,
  type TenantRiskData,
} from "@/packages/supabase/src/queries/tenant"

interface PropertyReportPageProps {
  propertyId: string
}

export default function PropertyReportPage({
  propertyId,
}: PropertyReportPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [propertyData, setPropertyData] = useState<PropertyRiskSummary | null>(
    null,
  )
  const [tenantRiskData, setTenantRiskData] = useState<TenantRiskData[]>([])

  useEffect(() => {
    async function loadPropertyRiskData() {
      try {
        setIsLoading(true)
        setError(null)

        console.log(
          "📊 [PropertyReport] Loading risk analysis data for property:",
          propertyId,
        )

        const { summary, tenants } =
          await getPropertyTenantRiskAnalysis(propertyId)

        if (!summary) {
          throw new Error("Property not found or no data available")
        }

        console.log("📊 [PropertyReport] Loaded data:", {
          summary,
          tenants: tenants.length,
        })

        setPropertyData(summary)
        setTenantRiskData(tenants)
      } catch (err) {
        console.error("📊 [PropertyReport] Error loading data:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load property data",
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      loadPropertyRiskData()
    }
  }, [propertyId])

  const getRiskColor = (probability: number) => {
    if (probability >= 60) return "text-red-600"
    if (probability >= 30) return "text-orange-500"
    if (probability >= 15) return "text-yellow-600"
    return "text-green-600"
  }

  const getPermissionColor = (hasPermission: boolean) => {
    return hasPermission ? "text-green-600" : "text-red-600"
  }

  const formatAddress = (address: string) => {
    return address || "Address not available"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="space-y-6">
            {/* Loading skeleton */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="mb-4 h-8 rounded bg-slate-200" />
                  <div className="mb-6 h-4 rounded bg-slate-200" />
                  <div className="grid grid-cols-3 gap-6">
                    <div className="h-20 rounded bg-slate-200" />
                    <div className="h-20 rounded bg-slate-200" />
                    <div className="h-20 rounded bg-slate-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4 text-red-600">
                  <FileText className="mx-auto h-12 w-12" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Unable to Load Property Report
                </h3>
                <p className="mb-4 text-slate-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  No Data Available
                </h3>
                <p className="text-slate-600">
                  No risk analysis data found for this property. Add tenants and
                  run analysis to see the report.
                </p>
              </div>
            </CardContent>
          </Card>
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
              onClick={() => {
                // In a real app, this would open a share dialog
                console.log("Sharing report for property:", propertyId)
              }}
              className="bg-transparent"
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              onClick={() => {
                // In a real app, this would generate and download a PDF report
                console.log("Downloading report for property:", propertyId)
              }}
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
              {propertyData.property_name}
            </CardTitle>
            <CardDescription className="text-lg">
              {formatAddress(propertyData.property_address)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {propertyData.occupied_units}
                </div>
                <div className="text-sm text-slate-600">Occupied Units</div>
                <div className="text-xs text-slate-500">
                  of {propertyData.total_units} total
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getRiskColor(propertyData.average_risk)}`}
                >
                  {propertyData.average_risk}%
                </div>
                <div className="text-sm text-slate-600">Average Risk</div>
                <div className="text-xs text-slate-500">across all tenants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {propertyData.occupancy_rate}%
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
                      {tenant.tenant_name}
                    </div>
                    <div className="text-slate-600">{tenant.unit_number}</div>
                    <div
                      className={`font-semibold ${getPermissionColor(tenant.soft_credit_permission)}`}
                    >
                      {tenant.soft_credit_permission ? "YES" : "NO"}
                    </div>
                    <div
                      className={`text-lg font-bold ${getRiskColor(tenant.default_probability)}`}
                    >
                      {tenant.default_probability}%
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
