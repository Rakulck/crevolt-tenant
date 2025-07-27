"use client"

import { useEffect, useState } from "react"

import {
  ArrowLeft,
  Building2,
  Camera,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { uploadProfileImage } from "@/packages/supabase/src/buckets/profile-images/profile-images-client"
import type {
  ProfileUpdateData,
  UserProfile,
} from "@/packages/supabase/src/queries/profile"

// Import our profile management functions

// Type based on our database schema
interface ProfileFormData {
  full_name: string
  email: string
  company_name: string
  phone: string
  timezone: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, loading, updating, updateProfile, setProfile } = useProfile()

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Form data state
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    timezone: "America/New_York",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        company_name: profile.company_name || "",
        phone: profile.phone || "",
        timezone: profile.timezone || "America/New_York",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "United States",
      })
    }
  }, [profile])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original data
      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          company_name: profile.company_name || "",
          phone: profile.phone || "",
          timezone: profile.timezone || "America/New_York",
          address: profile.address || "",
          city: profile.city || "",
          state: profile.state || "",
          postal_code: profile.postal_code || "",
          country: profile.country || "United States",
        })
      }
    }
    setIsEditing(!isEditing)
    setError(null)
  }

  const handleSaveProfile = async () => {
    setError(null)

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        setError("Full name is required")
        return
      }

      if (!formData.email.trim()) {
        setError("Email is required")
        return
      }

      // Validate ZIP code format if provided
      if (
        formData.postal_code &&
        !/^\d{5}(-\d{4})?$/.test(formData.postal_code)
      ) {
        setError("Invalid ZIP code format")
        return
      }

      // Prepare update data
      const updateData: ProfileUpdateData = {
        full_name: formData.full_name.trim(),
        company_name: formData.company_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        timezone: formData.timezone,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        country: formData.country.trim() || undefined,
      }

      // Store original profile for potential rollback
      const originalProfile = profile

      // Optimistic UI update - immediately show changes
      setProfile((prevProfile: UserProfile | null) =>
        prevProfile
          ? {
              ...prevProfile,
              ...updateData,
              updated_at: new Date().toISOString(), // Update timestamp
            }
          : prevProfile,
      )

      // Exit editing mode immediately for better UX
      setIsEditing(false)

      // Update in background
      const result = await updateProfile(updateData)

      if (!result.success) {
        // Rollback on error
        setProfile(originalProfile)
        setIsEditing(true) // Re-enter editing mode
        setError(result.error || "Failed to update profile")
      }
      // If successful, the optimistic update already shows the correct data
    } catch (error) {
      // Rollback on error
      setProfile(profile)
      setIsEditing(true)
      setError("An unexpected error occurred")
      console.error("Profile update error:", error)
    }
  }

  /**
   * Compress and convert image to base64
   */
  const _compressImage = async (
    file: File,
  ): Promise<{ data: string; type: string }> => {
    console.log("=== Starting Image Compression ===")
    console.log("Original file:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    })

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        console.log("File read complete")
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          console.log("Image loaded:", {
            originalWidth: img.width,
            originalHeight: img.height,
          })

          const canvas = document.createElement("canvas")
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 800
          let { width } = img
          let { height } = img

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          console.log("Resized dimensions:", { width, height })

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, width, height)

          // Convert to base64 with quality 0.8 for JPEG
          const mimeType =
            file.type === "image/jpeg" ? "image/jpeg" : "image/png"
          const quality = mimeType === "image/jpeg" ? 0.8 : 1
          console.log("Compression settings:", { mimeType, quality })

          const base64 = canvas.toDataURL(mimeType, quality)
          console.log("Compression complete:", {
            originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            compressedSize: `${(base64.length / 1024 / 1024).toFixed(2)}MB`,
          })

          console.log("=== Image Compression Completed ===")
          resolve({ data: base64, type: mimeType })
        }
        img.onerror = (error) => {
          console.error("Image load error:", error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error("File read error:", error)
        reject(error)
      }
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  // Show error if no profile data
  if (!profile && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Alert className="max-w-md">
          <AlertDescription>
            Unable to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleImageUpload = async (file: File) => {
    if (!file || !user?.id) return

    try {
      // Create immediate preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setIsUploading(true)
      setError(null)

      // Upload image directly from client
      const uploadResult = await uploadProfileImage(file, user.id)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // Optimistic UI update - immediately update local profile state
      setProfile((prevProfile: UserProfile | null) =>
        prevProfile
          ? {
              ...prevProfile,
              profile_image_url: uploadResult.url || null,
            }
          : prevProfile,
      )

      // Cleanup preview URL after successful upload
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(null)

      // Optional: Update the profile in database for persistence
      // This can happen in background without blocking UI
      updateProfile({
        profile_image_url: uploadResult.url,
      }).catch((error) => {
        console.error("Background profile update failed:", error)
        // Optionally show a warning toast that data might not be synced
      })
    } catch (error) {
      console.error("=== Profile Image Update Failed ===")
      console.error("Error details:", error)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(
        error instanceof Error ? error.message : "Failed to upload image",
      )
    } finally {
      setIsUploading(false)
    }
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
              <User className="h-6 w-6 text-[#4F46E5]" />
              <h1 className="text-xl font-semibold text-slate-900">
                Profile Settings
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleEditToggle}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={updating}
                  className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEditToggle}
                className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>
                Your account information and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={
                        previewUrl ||
                        profile?.profile_image_url ||
                        "/placeholder.svg"
                      }
                      alt="Profile picture"
                      className={isUploading ? "opacity-50" : ""} // Add opacity during upload
                    />
                    <AvatarFallback className="bg-[#4F46E5]/10 text-lg text-[#4F46E5]">
                      {formData.full_name
                        ? getInitials(formData.full_name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {formData.full_name || "No name set"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formData.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    disabled={!isEditing}
                    className="h-11"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled={true} // Email should not be editable for security
                      className="h-11 bg-slate-50 pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Email cannot be changed here for security reasons
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                    <Input
                      id="company"
                      value={formData.company_name}
                      onChange={(e) =>
                        handleInputChange("company_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className="h-11 pl-10"
                      placeholder="Your company name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className="h-11 pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Your business or home address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    disabled={!isEditing}
                    className="h-11 pl-10"
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={!isEditing}
                    className="h-11"
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    disabled={!isEditing}
                    className="h-11"
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">ZIP Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) =>
                      handleInputChange("postal_code", e.target.value)
                    }
                    disabled={!isEditing}
                    className="h-11"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={!isEditing}
                  className="h-11"
                  placeholder="United States"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
