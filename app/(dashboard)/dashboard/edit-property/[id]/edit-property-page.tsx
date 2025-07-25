"use client"
import { useEffect, useState } from "react"

import {
  ArrowLeft,
  Building2,
  Calendar,
  Hash,
  MapPin,
  Save,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPropertyById,
  updateProperty,
  type UpdatePropertyData,
} from "@/packages/supabase/src/queries/property"
import {
  deleteTenant,
  getPropertyTenants,
  updateTenant,
  type Tenant,
  type UpdateTenantData,
} from "@/packages/supabase/src/queries/tenant"

import { AddressAutocomplete } from "../../../../../components/address-autocomplete"
import { GoogleMapsScript } from "../../../../../components/google-maps-script"

interface PropertyData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  numberOfUnits: string
  yearBuilt: string
  propertyType: string
  description: string
  defaultRisk: number
  tenantCount: number
  lastUpdated: string
}

interface EditPropertyPageProps {
  propertyId: string
}

export default function EditPropertyPage({
  propertyId,
}: EditPropertyPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("property")

  const [propertyData, setPropertyData] = useState<PropertyData>({
    id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    numberOfUnits: "",
    yearBuilt: "",
    propertyType: "",
    description: "",
    defaultRisk: 0,
    tenantCount: 0,
    lastUpdated: "",
  })

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)

  useEffect(() => {
    async function loadPropertyData() {
      try {
        setIsLoading(true)

        const property = await getPropertyById(propertyId)

        if (property) {
          setPropertyData({
            id: property.id,
            name: property.name,
            address: property.address.street_address || "",
            city: property.address.city || "",
            state: property.address.state || "",
            zipCode: property.address.zip_code || "",
            numberOfUnits: property.total_units.toString(),
            yearBuilt: property.year_built?.toString() || "",
            propertyType: property.property_type,
            description: property.description || "",
            defaultRisk: 0, // TODO: Calculate from tenants
            tenantCount: 0, // TODO: Get from tenants
            lastUpdated: new Date(property.updated_at).toLocaleDateString(),
          })

          // Load tenants for this property
          const propertyTenants = await getPropertyTenants(propertyId)
          setTenants(propertyTenants)
          setLoadingTenants(false)
        } else {
          throw new Error("Property not found")
        }
      } catch (error) {
        console.error("🚨 [EditProperty] Failed to load property:", error)
        console.error("🔍 [EditProperty] Property ID:", propertyId)
        console.error("📊 [EditProperty] Error details:", {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "No stack trace",
        })

        // More specific error messages
        let errorMessage = "Failed to load property"
        if (error instanceof Error) {
          if (error.message.includes("not found")) {
            errorMessage = "Property not found or you don't have access to it"
          } else if (error.message.includes("auth")) {
            errorMessage = "Authentication error - please log in again"
          } else {
            errorMessage = `Error: ${error.message}`
          }
        }

        alert(
          `${errorMessage}. Check console for details. Redirecting to dashboard...`,
        )
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadPropertyData()
  }, [propertyId, router])

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    setPropertyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTenantChange = (
    tenantId: string,
    field: keyof Tenant,
    value: string | number,
  ) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, [field]: value } : tenant,
      ),
    )
  }

  const handleRemoveTenant = async (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId)

    if (
      confirm(
        `Are you sure you want to remove tenant "${tenant?.tenant_name}"? This action cannot be undone.`,
      )
    ) {
      try {
        const result = await deleteTenant(tenantId)

        if (result.success) {
          // Remove from local state
          setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId))
          alert("Tenant removed successfully!")
        } else {
          throw new Error(result.error || "Failed to remove tenant")
        }
      } catch (error) {
        console.error("Delete tenant error:", error)
        alert(
          `Failed to remove tenant: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const updateData: UpdatePropertyData = {
        id: propertyData.id,
        name: propertyData.name,
        property_type: propertyData.propertyType as
          | "single_family"
          | "duplex"
          | "triplex"
          | "fourplex"
          | "apartment_complex"
          | "condominium"
          | "townhouse"
          | "mixed_use"
          | "other",
        total_units: parseInt(propertyData.numberOfUnits) || 1,
        year_built: propertyData.yearBuilt
          ? parseInt(propertyData.yearBuilt)
          : undefined,
        description: propertyData.description || undefined,
        address: {
          street_address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state || undefined,
          zip_code: propertyData.zipCode || undefined,
          country: "United States",
        },
      }

      const propertyResult = await updateProperty(updateData)

      if (!propertyResult.success) {
        throw new Error(propertyResult.error || "Failed to update property")
      }

      // Update all tenant data
      const tenantUpdatePromises = tenants.map(async (tenant) => {
        const tenantUpdateData: UpdateTenantData = {
          id: tenant.id,
          tenant_name: tenant.tenant_name || "",
          unit_number: tenant.unit_number || "",
          monthly_rent: tenant.monthly_rent || 0,
          lease_start_date: tenant.lease_start_date || undefined,
          lease_end_date: tenant.lease_end_date || undefined,
        }

        const tenantResult = await updateTenant(tenantUpdateData)
        if (!tenantResult.success) {
          throw new Error(
            `Failed to update tenant ${tenant.tenant_name}: ${tenantResult.error}`,
          )
        }
        return tenantResult
      })

      await Promise.all(tenantUpdatePromises)

      alert("Property and tenant information updated successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Save property error:", error)
      alert(
        `Failed to save property: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setIsSaving(false)
    }
  }

  const _getRiskColor = (risk: number) => {
    if (risk <= 10) return "text-green-600 bg-green-100"
    if (risk <= 20) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "expired":
        return "text-red-600 bg-red-100"
      default:
        return "text-slate-600 bg-slate-100"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4F46E5]" />
          <p className="text-slate-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <GoogleMapsScript />
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
                  Edit Property
                </h1>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="property">Property Details</TabsTrigger>
              <TabsTrigger value="tenants">Tenant Information</TabsTrigger>
            </TabsList>

            {/* Property Details Tab */}
            <TabsContent value="property" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-900">
                    Property Information
                  </CardTitle>
                  <CardDescription>
                    Update your property details and information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="mb-4 flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="property-name"
                          className="text-sm font-medium"
                        >
                          Property Name *
                        </Label>
                        <Input
                          id="property-name"
                          placeholder="e.g., Sunset Apartments - Unit 4B"
                          value={propertyData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="property-type"
                          className="text-sm font-medium"
                        >
                          Property Type *
                        </Label>
                        <Select
                          value={propertyData.propertyType}
                          onValueChange={(value) =>
                            handleInputChange("propertyType", value)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_family">
                              Single Family Home
                            </SelectItem>
                            <SelectItem value="duplex">Duplex</SelectItem>
                            <SelectItem value="triplex">Triplex</SelectItem>
                            <SelectItem value="fourplex">Fourplex</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="apartment_complex">
                              Apartment Complex
                            </SelectItem>
                            <SelectItem value="condominium">
                              Condominium
                            </SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="mixed_use">Mixed Use</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="number-of-units"
                          className="text-sm font-medium"
                        >
                          Number of Units *
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                          <Input
                            id="number-of-units"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={propertyData.numberOfUnits}
                            onChange={(e) =>
                              handleInputChange("numberOfUnits", e.target.value)
                            }
                            required
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-6">
                    <div className="mb-4 flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Location
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="address"
                          className="text-sm font-medium"
                        >
                          Street Address *
                        </Label>
                        <AddressAutocomplete
                          id="address"
                          placeholder="123 Main Street"
                          value={propertyData.address}
                          onChange={(value: string) =>
                            handleInputChange("address", value)
                          }
                          onAddressSelect={(addressData: any) => {
                            setPropertyData((prev) => ({
                              ...prev,
                              address: addressData.address,
                              city: addressData.city,
                              state: addressData.state,
                              zipCode: addressData.zipCode,
                            }))
                          }}
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium">
                            City *
                          </Label>
                          <Input
                            id="city"
                            placeholder="Los Angeles"
                            value={propertyData.city}
                            onChange={(e) =>
                              handleInputChange("city", e.target.value)
                            }
                            required
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="state"
                            className="text-sm font-medium"
                          >
                            State *
                          </Label>
                          <Input
                            id="state"
                            placeholder="CA"
                            value={propertyData.state}
                            onChange={(e) =>
                              handleInputChange("state", e.target.value)
                            }
                            required
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="zip-code"
                            className="text-sm font-medium"
                          >
                            ZIP Code *
                          </Label>
                          <Input
                            id="zip-code"
                            placeholder="90028"
                            value={propertyData.zipCode}
                            onChange={(e) =>
                              handleInputChange("zipCode", e.target.value)
                            }
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-6">
                    <div className="mb-4 flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Additional Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="year-built"
                          className="text-sm font-medium"
                        >
                          Year Built{" "}
                          <span className="text-slate-400">(Optional)</span>
                        </Label>
                        <Input
                          id="year-built"
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          placeholder="2020"
                          value={propertyData.yearBuilt}
                          onChange={(e) =>
                            handleInputChange("yearBuilt", e.target.value)
                          }
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tenant Information Tab */}
            <TabsContent value="tenants" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">
                        Tenant Information
                      </CardTitle>
                      <CardDescription>
                        Manage tenants for {propertyData.name}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/add-tenant?propertyId=${propertyId}`,
                        )
                      }
                      className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Add Tenant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTenants ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4F46E5]" />
                      <p className="text-slate-600">Loading tenants...</p>
                    </div>
                  ) : tenants.length > 0 ? (
                    <div className="space-y-4">
                      {tenants.map((tenant, _index) => (
                        <Card key={tenant.id} className="border-slate-200">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`tenant-name-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Tenant Name
                                </Label>
                                <Input
                                  id={`tenant-name-${tenant.id}`}
                                  value={tenant.tenant_name || ""}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "tenant_name",
                                      e.target.value,
                                    )
                                  }
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`unit-number-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Unit Number
                                </Label>
                                <Input
                                  id={`unit-number-${tenant.id}`}
                                  value={tenant.unit_number || ""}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "unit_number",
                                      e.target.value,
                                    )
                                  }
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`monthly-rent-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Monthly Rent
                                </Label>
                                <Input
                                  id={`monthly-rent-${tenant.id}`}
                                  type="number"
                                  value={tenant.monthly_rent || ""}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "monthly_rent",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="2500"
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`lease-start-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Lease Start Date
                                </Label>
                                <Input
                                  id={`lease-start-${tenant.id}`}
                                  type="date"
                                  value={tenant.lease_start_date || ""}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "lease_start_date",
                                      e.target.value,
                                    )
                                  }
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`lease-end-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Lease End Date
                                </Label>
                                <Input
                                  id={`lease-end-${tenant.id}`}
                                  type="date"
                                  value={tenant.lease_end_date || ""}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "lease_end_date",
                                      e.target.value,
                                    )
                                  }
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`status-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Status
                                </Label>
                                <Select
                                  value={tenant.tenant_status || "active"}
                                  onValueChange={(value) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "tenant_status",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="notice_given">
                                      Notice Given
                                    </SelectItem>
                                    <SelectItem value="vacated">
                                      Vacated
                                    </SelectItem>
                                    <SelectItem value="evicted">
                                      Evicted
                                    </SelectItem>
                                    <SelectItem value="lease_expired">
                                      Lease Expired
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(tenant.tenant_status || "active")}`}
                                >
                                  {tenant.tenant_status
                                    ?.replace("_", " ")
                                    .toUpperCase() || "ACTIVE"}
                                </div>
                                <span className="text-sm text-slate-600">
                                  Risk Level:{" "}
                                  <span
                                    className={`font-medium capitalize ${
                                      tenant.current_risk_level === "low"
                                        ? "text-green-600"
                                        : tenant.current_risk_level === "medium"
                                          ? "text-yellow-600"
                                          : tenant.current_risk_level === "high"
                                            ? "text-red-600"
                                            : "text-gray-600"
                                    }`}
                                  >
                                    {tenant.current_risk_level || "Unknown"}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveTenant(tenant.id)}
                                  className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                                >
                                  Remove Tenant
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                      <h3 className="mb-2 text-lg font-medium text-slate-900">
                        No tenants yet
                      </h3>
                      <p className="mb-4 text-slate-600">
                        Add tenants to start tracking their information and risk
                        scores.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(
                            `/dashboard/add-tenant?propertyId=${propertyId}`,
                          )
                        }
                        className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Add First Tenant
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  )
}
