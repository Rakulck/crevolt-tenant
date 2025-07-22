"use client"

import { ArrowLeft, Building2, Calendar, Hash, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

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

import { AddressAutocomplete } from "../../../../components/address-autocomplete"
import { GoogleMapsScript } from "../../../../components/google-maps-script"
import { PropertySuccessModal } from "../../../../components/property-success-modal"

export default function AddPropertyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    numberOfUnits: "",
    yearBuilt: "",
    propertyType: "",
    description: "",
  })

  const [_autocomplete, setAutocomplete] = useState<any | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newPropertyId, setNewPropertyId] = useState("")

  // Add this state for tracking when Google Maps is loaded
  const [_isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  useEffect(() => {
    if (!window.google || !addressInputRef.current) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "us" },
      }
    )

    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace()

      if (place.address_components) {
        let streetNumber = ""
        let route = ""
        let city = ""
        let state = ""
        let zipCode = ""

        place.address_components.forEach((component) => {
          const { types } = component

          if (types.includes("street_number")) {
            streetNumber = component.long_name
          }
          if (types.includes("route")) {
            route = component.long_name
          }
          if (types.includes("locality")) {
            city = component.long_name
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name
          }
          if (types.includes("postal_code")) {
            zipCode = component.long_name
          }
        })

        const fullAddress = `${streetNumber} ${route}`.trim()

        setFormData((prev) => ({
          ...prev,
          address: fullAddress,
          city,
          state,
          zipCode,
        }))
      }
    })

    setAutocomplete(autocompleteInstance)

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Generate a unique ID for the property
    const propertyId = `prop_${Date.now()}`

    // Save property data to localStorage (in a real app, this would be a database)
    const existingProperties = JSON.parse(
      localStorage.getItem("properties") || "[]"
    )
    const newProperty = {
      ...formData,
      id: propertyId,
      address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      defaultRisk: Math.floor(Math.random() * 25) + 5, // Random risk for demo
      lastUpdated: "Just now",
      tenantCount: 0,
    }

    existingProperties.push(newProperty)
    localStorage.setItem("properties", JSON.stringify(existingProperties))

    // Show success modal
    setNewPropertyId(propertyId)
    setShowSuccessModal(true)
  }

  // Add the GoogleMapsScript component at the top of the return statement, before the main div:
  return (
    <>
      <GoogleMapsScript onLoad={() => setIsGoogleMapsLoaded(true)} />
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
                  Add New Property
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-6 py-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">
                Property Information
              </CardTitle>
              <CardDescription>
                Enter the details for your new property to start tracking tenant
                risk and analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
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
                        value={formData.name}
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
                        value={formData.propertyType}
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
                        <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                        <Input
                          id="number-of-units"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.numberOfUnits}
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
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address *
                      </Label>
                      <AddressAutocomplete
                        id="address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(value: string) =>
                          handleInputChange("address", value)
                        }
                        onAddressSelect={(addressData: any) => {
                          setFormData((prev) => ({
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
                          value={formData.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium">
                          State *
                        </Label>
                        <Input
                          id="state"
                          placeholder="CA"
                          value={formData.state}
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
                          value={formData.zipCode}
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
                        value={formData.yearBuilt}
                        onChange={(e) =>
                          handleInputChange("yearBuilt", e.target.value)
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 border-t border-slate-200 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#4F46E5] px-6 text-white hover:bg-[#4338CA]"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6 border-slate-200 bg-slate-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5]/10">
                    <Building2 className="h-4 w-4 text-[#4F46E5]" />
                  </div>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-slate-900">
                    Need Help?
                  </h4>
                  <p className="mb-3 text-sm text-slate-600">
                    Our system will automatically calculate tenant default risk
                    based on the property information you provide. You can
                    always edit these details later from your dashboard.
                  </p>
                  <Button
                    variant="link"
                    className="px-0 text-sm text-[#4F46E5] hover:text-[#4338CA]"
                  >
                    View Property Management Guide →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <PropertySuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          propertyName={formData.name}
          propertyId={newPropertyId}
        />
      </div>
    </>
  )
}
