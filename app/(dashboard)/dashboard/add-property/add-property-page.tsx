"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Building2, MapPin, Calendar, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { PropertySuccessModal } from "../../../../components/property-success-modal"
import { GoogleMapsScript } from "../../../../components/google-maps-script"
import { AddressAutocomplete } from "../../../../components/address-autocomplete"

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

  const [autocomplete, setAutocomplete] = useState<any | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newPropertyId, setNewPropertyId] = useState("")

  // Add this state for tracking when Google Maps is loaded
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  useEffect(() => {
    if (!window.google || !addressInputRef.current) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
    })

    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace()

      if (place.address_components) {
        let streetNumber = ""
        let route = ""
        let city = ""
        let state = ""
        let zipCode = ""

        place.address_components.forEach((component) => {
          const types = component.types

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
          city: city,
          state: state,
          zipCode: zipCode,
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
    const existingProperties = JSON.parse(localStorage.getItem("properties") || "[]")
    const newProperty = {
      id: propertyId,
      name: formData.name,
      address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      defaultRisk: Math.floor(Math.random() * 25) + 5, // Random risk for demo
      lastUpdated: "Just now",
      tenantCount: 0,
      ...formData,
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
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-[#4F46E5]" />
                <h1 className="text-xl font-semibold text-slate-900">Add New Property</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Property Information</CardTitle>
              <CardDescription>
                Enter the details for your new property to start tracking tenant risk and analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="property-name" className="text-sm font-medium">
                        Property Name *
                      </Label>
                      <Input
                        id="property-name"
                        placeholder="e.g., Sunset Apartments - Unit 4B"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property-type" className="text-sm font-medium">
                        Property Type *
                      </Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => handleInputChange("propertyType", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment Complex</SelectItem>
                          <SelectItem value="single-family">Single Family Home</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                          <SelectItem value="commercial">Commercial Property</SelectItem>
                          <SelectItem value="mixed-use">Mixed Use</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number-of-units" className="text-sm font-medium">
                        Number of Units *
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="number-of-units"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.numberOfUnits}
                          onChange={(e) => handleInputChange("numberOfUnits", e.target.value)}
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
                    <h3 className="text-lg font-semibold text-slate-900">Location</h3>
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
                        onChange={(value) => handleInputChange("address", value)}
                        onAddressSelect={(addressData) => {
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City *
                        </Label>
                        <Input
                          id="city"
                          placeholder="Los Angeles"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
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
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip-code" className="text-sm font-medium">
                          ZIP Code *
                        </Label>
                        <Input
                          id="zip-code"
                          placeholder="90028"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
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
                    <h3 className="text-lg font-semibold text-slate-900">Additional Details</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="year-built" className="text-sm font-medium">
                        Year Built <span className="text-slate-400">(Optional)</span>
                      </Label>
                      <Input
                        id="year-built"
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                        placeholder="2020"
                        value={formData.yearBuilt}
                        onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="px-6">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6">
                    <Building2 className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6 bg-slate-50 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[#4F46E5]/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-[#4F46E5]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Need Help?</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Our system will automatically calculate tenant default risk based on the property information you
                    provide. You can always edit these details later from your dashboard.
                  </p>
                  <Button variant="link" className="px-0 text-[#4F46E5] hover:text-[#4338CA] text-sm">
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
