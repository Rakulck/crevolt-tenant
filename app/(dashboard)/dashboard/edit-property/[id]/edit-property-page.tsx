"use client"
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
  ArrowLeft,
  Building2,
  Calendar,
  Hash,
  MapPin,
  Save,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

interface TenantInfo {
  id: string
  name: string
  unitNumber: string
  monthlyRent: string
  leaseStart: string
  leaseEnd: string
  status: string
  riskScore: number
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

  const [tenants, setTenants] = useState<TenantInfo[]>([
    {
      id: "1",
      name: "John Smith",
      unitNumber: "4B",
      monthlyRent: "$2,500",
      leaseStart: "2024-01-15",
      leaseEnd: "2024-12-15",
      status: "Active",
      riskScore: 12,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      unitNumber: "3A",
      monthlyRent: "$2,200",
      leaseStart: "2023-11-01",
      leaseEnd: "2024-10-31",
      status: "Active",
      riskScore: 8,
    },
  ])

  useEffect(() => {
    // Simulate loading property data
    setTimeout(() => {
      // In a real app, this would fetch from API using propertyId
      setPropertyData({
        id: propertyId,
        name: "Sunset Apartments - Unit 4B",
        address: "1234 Sunset Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90028",
        numberOfUnits: "24",
        yearBuilt: "2018",
        propertyType: "apartment",
        description: "Modern apartment complex with amenities",
        defaultRisk: 12,
        tenantCount: 2,
        lastUpdated: "2 days ago",
      })
      setIsLoading(false)
    }, 1000)
  }, [propertyId])

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    setPropertyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTenantChange = (
    tenantId: string,
    field: keyof TenantInfo,
    value: string | number
  ) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, [field]: value } : tenant
      )
    )
  }

  const handleRemoveTenant = (tenantId: string) => {
    if (confirm("Are you sure you want to remove this tenant?")) {
      setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      // In a real app, this would save both property and tenant data
      console.log("Saving property:", propertyData)
      console.log("Saving tenants:", tenants)
      alert("Property and tenant information updated successfully!")
    }, 1500)
  }

  const getRiskColor = (risk: number) => {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5] mx-auto mb-4" />
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
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md">
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
                    <div className="flex items-center space-x-2 mb-4">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
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
                            <SelectItem value="apartment">
                              Apartment Complex
                            </SelectItem>
                            <SelectItem value="single-family">
                              Single Family Home
                            </SelectItem>
                            <SelectItem value="duplex">Duplex</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="condo">Condominium</SelectItem>
                            <SelectItem value="commercial">
                              Commercial Property
                            </SelectItem>
                            <SelectItem value="mixed-use">Mixed Use</SelectItem>
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
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                    <div className="flex items-center space-x-2 mb-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="flex items-center space-x-2 mb-4">
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
                          `/dashboard/add-tenant?propertyId=${propertyId}`
                        )
                      }
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Tenant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tenants.length > 0 ? (
                    <div className="space-y-4">
                      {tenants.map((tenant, index) => (
                        <Card key={tenant.id} className="border-slate-200">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`tenant-name-${tenant.id}`}
                                  className="text-sm font-medium"
                                >
                                  Tenant Name
                                </Label>
                                <Input
                                  id={`tenant-name-${tenant.id}`}
                                  value={tenant.name}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "name",
                                      e.target.value
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
                                  value={tenant.unitNumber}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "unitNumber",
                                      e.target.value
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
                                  value={tenant.monthlyRent}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "monthlyRent",
                                      e.target.value
                                    )
                                  }
                                  placeholder="$2,500"
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
                                  value={tenant.leaseStart}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "leaseStart",
                                      e.target.value
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
                                  value={tenant.leaseEnd}
                                  onChange={(e) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "leaseEnd",
                                      e.target.value
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
                                  value={tenant.status}
                                  onValueChange={(value) =>
                                    handleTenantChange(
                                      tenant.id,
                                      "status",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="Pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="Expired">
                                      Expired
                                    </SelectItem>
                                    <SelectItem value="Terminated">
                                      Terminated
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}
                                >
                                  {tenant.status}
                                </div>
                                <span className="text-sm text-slate-600">
                                  Risk Score:{" "}
                                  <span
                                    className={`font-medium ${getRiskColor(tenant.riskScore).split(" ")[0]}`}
                                  >
                                    {tenant.riskScore}%
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveTenant(tenant.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No tenants yet
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Add tenants to start tracking their information and risk
                        scores.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(
                            `/dashboard/add-tenant?propertyId=${propertyId}`
                          )
                        }
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                      >
                        <Users className="h-4 w-4 mr-2" />
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
