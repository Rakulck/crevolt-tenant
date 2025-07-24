"use client"

import { useState } from "react"

import {
  ArrowLeft,
  Building2,
  Calendar,
  Hash,
  Loader2,
  MapPin,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { AddressAutocomplete } from "@/components/address-autocomplete"
import { GoogleMapsScript } from "@/components/google-maps-script"
import { PropertySuccessModal } from "@/components/property-success-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"
import {
  createProperty,
  type CreatePropertyData,
} from "@/packages/supabase/src/queries/property"

export default function AddPropertyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States", // Default country, will be updated by Google Maps
    numberOfUnits: "",
    yearBuilt: "",
    propertyType: "",
    description: "",
  })

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newPropertyId, setNewPropertyId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  const handleAddressSelect = (addressData: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: { lat: number; lng: number }
    components: {
      streetNumber?: string
      route?: string
      neighborhood?: string
      locality?: string
      sublocality?: string
      administrativeAreaLevel1?: string
      administrativeAreaLevel2?: string
      postalCode?: string
      country?: string
    }
  }) => {
    console.log("Address selected:", addressData)

    // Handle missing data gracefully
    setFormData((prev) => ({
      ...prev,
      address: addressData.address || "",
      city: addressData.city || "",
      state: addressData.state || "",
      zipCode: addressData.zipCode || "",
      country: addressData.country || "United States", // Update country from Google Maps
    }))

    // Show warnings for missing data
    if (!addressData.zipCode) {
      console.warn("No ZIP code available for this address")
      // You could show a warning toast here if needed
    }

    if (!addressData.state) {
      console.warn("No state/province available for this address")
      // Some international addresses don't have states
    }

    // Clear any existing errors since user selected an address
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Property name is required")
      }
      if (!formData.address.trim()) {
        throw new Error("Street address is required")
      }
      if (!formData.city.trim()) {
        throw new Error("City is required")
      }
      // State and ZIP are now optional for international addresses
      if (!formData.numberOfUnits.trim()) {
        throw new Error("Number of units is required")
      }
      if (!formData.propertyType) {
        throw new Error("Property type is required")
      }

      // Show warnings for missing optional fields
      if (!formData.state.trim()) {
        console.warn("State/Province not provided - may affect some features")
      }
      if (!formData.zipCode.trim()) {
        console.warn("ZIP/Postal code not provided - may affect some features")
      }

      // Prepare property data with enhanced address information
      const propertyData: CreatePropertyData = {
        name: formData.name.trim(),
        property_type:
          formData.propertyType as CreatePropertyData["property_type"],
        address: {
          street_address: formData.address.trim(),
          unit_number: undefined, // Unit number can be added later if needed
          city: formData.city.trim(),
          state: formData.state.trim() || undefined, // Allow undefined for international addresses
          zip_code: formData.zipCode.trim() || undefined, // Allow undefined for international addresses
          country: formData.country, // Use the country from the form
          latitude: undefined, // No longer storing coordinates
          longitude: undefined, // No longer storing coordinates
        },
        total_units: parseInt(formData.numberOfUnits),
        year_built: formData.yearBuilt
          ? parseInt(formData.yearBuilt)
          : undefined,
        description: formData.description.trim() || undefined,
      }

      // Validate units is a positive number
      if (isNaN(propertyData.total_units) || propertyData.total_units < 1) {
        throw new Error("Number of units must be a positive number")
      }

      // Validate year if provided
      if (
        formData.yearBuilt &&
        (isNaN(parseInt(formData.yearBuilt)) ||
          parseInt(formData.yearBuilt) < 1800)
      ) {
        throw new Error("Please enter a valid year (1800 or later)")
      }

      console.log("Creating property with data:", propertyData)

      // Create property in database
      const result = await createProperty(propertyData)

      if (!result.success) {
        throw new Error(result.error || "Failed to create property")
      }

      console.log("Property created successfully:", result.data?.id)

      // Show success modal
      setNewPropertyId(result.data?.id || "")
      setShowSuccessModal(true)

      // Reset form
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States", // Reset country to default
        numberOfUnits: "",
        yearBuilt: "",
        propertyType: "",
        description: "",
      })
    } catch (error) {
      console.error("Property creation error:", error)
      setError(
        error instanceof Error ? error.message : "Failed to create property",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add the GoogleMapsScript component at the top of the return statement, before the main div:
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
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                          value={formData.numberOfUnits}
                          onChange={(e) =>
                            handleInputChange("numberOfUnits", e.target.value)
                          }
                          required
                          className="h-11 pl-10"
                          disabled={isSubmitting}
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
                      <div className="relative">
                        <AddressAutocomplete
                          id="address"
                          placeholder="123 Main Street"
                          value={formData.address}
                          onChange={(value: string) =>
                            handleInputChange("address", value)
                          }
                          onAddressSelect={handleAddressSelect}
                          required
                          className="h-11"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="country"
                          className="text-sm font-medium"
                        >
                          Country *
                        </Label>
                        <Input
                          id="country"
                          placeholder="United States"
                          value={formData.country}
                          onChange={(e) =>
                            handleInputChange("country", e.target.value)
                          }
                          required
                          className="h-11"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium">
                          State/Province{" "}
                          <span className="text-slate-400">(Optional)</span>
                        </Label>
                        <Input
                          id="state"
                          placeholder="CA"
                          value={formData.state}
                          onChange={(e) =>
                            handleInputChange("state", e.target.value)
                          }
                          className="h-11"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="zip-code"
                          className="text-sm font-medium"
                        >
                          ZIP/Postal Code{" "}
                          <span className="text-slate-400">(Optional)</span>
                        </Label>
                        <Input
                          id="zip-code"
                          placeholder="90028"
                          value={formData.zipCode}
                          onChange={(e) =>
                            handleInputChange("zipCode", e.target.value)
                          }
                          className="h-11"
                          disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Description{" "}
                        <span className="text-slate-400">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the property..."
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className="h-24"
                        disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#4F46E5] px-6 text-white hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Adding..." : "Add Property"}
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
