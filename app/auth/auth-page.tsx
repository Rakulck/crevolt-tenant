"use client"

import React, { useState } from "react"

import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import {
  signIn,
  signUpWithDetails,
} from "../../packages/supabase/src/queries/auth"

interface FormErrors {
  email?: string
  password?: string
  full_name?: string
  company_name?: string
  phone?: string
  general?: string
}

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSignupSuccess, setShowSignupSuccess] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    company_name: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== CLIENT: Login Form Submitted ===")
    console.log("Form data:", {
      email: loginForm.email,
      password: "[REDACTED]",
    })

    setIsLoading(true)
    setErrors({})

    const formData = new FormData()
    formData.append("email", loginForm.email)
    formData.append("password", loginForm.password)

    console.log("CLIENT: FormData created, calling server signIn function...")

    try {
      const result = await signIn(formData)
      console.log("CLIENT: Server signIn response:", {
        success: result.success,
        message: result.message,
        error: result.error,
      })

      if (result.success) {
        console.log(
          "CLIENT: Login successful, showing toast and redirecting...",
        )
        toast({
          title: "Success!",
          description: result.message,
        })
        console.log("CLIENT: Calling router.push('/dashboard')...")
        router.push("/dashboard")
        console.log("CLIENT: Router push called")
      } else {
        console.log("CLIENT: Login failed:", result.error)
        setErrors({ general: result.error })
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("CLIENT: Exception during login:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in"
      setErrors({ general: errorMessage })
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      console.log("CLIENT: Setting loading to false")
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const userData = {
        email: signupForm.email,
        password: signupForm.password,
        full_name: `${signupForm.firstName} ${signupForm.lastName}`.trim(),
        company_name: signupForm.company_name,
        phone: signupForm.phone,
        timezone: "America/New_York",
      }

      const result = await signUpWithDetails(userData)

      if (result.success) {
        setSignupEmail(signupForm.email)
        setShowSignupSuccess(true)

        toast({
          title: "Success!",
          description: result.message,
        })

        // Reset form
        setSignupForm({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          password: "",
          company_name: "",
        })
      } else {
        setErrors({ general: result.error })
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account"
      setErrors({ general: errorMessage })
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show signup success message
  if (showSignupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              TenantPro Analytics
            </h1>
            <p className="mt-2 text-slate-600">
              Professional Tenant Analysis Platform
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-center text-2xl text-slate-900">
                Account Created Successfully!
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                Please check your email to verify your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="mb-2 text-sm text-slate-700">
                  <strong>Verification email sent to:</strong>
                </p>
                <p className="font-medium text-slate-900">{signupEmail}</p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowSignupSuccess(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Didn't receive the email?{" "}
              <Button
                variant="link"
                className="px-0 text-[#4F46E5] hover:text-[#4338CA]"
                onClick={handleSignup}
                disabled={isLoading}
              >
                Resend verification
              </Button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            TenantPro Analytics
          </h1>
          <p className="mt-2 text-slate-600">
            Professional Tenant Analysis Platform
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl text-slate-900">
              Welcome
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Access your tenant analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {errors.general && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="john@company.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="rounded"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-slate-600"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="px-0 text-[#4F46E5] hover:text-[#4338CA]"
                      onClick={() => router.push("/auth/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                {errors.general && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        placeholder="John"
                        value={signupForm.firstName}
                        onChange={(e) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        placeholder="Doe"
                        value={signupForm.lastName}
                        onChange={(e) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Your Company LLC"
                      value={signupForm.company_name}
                      onChange={(e) =>
                        setSignupForm((prev) => ({
                          ...prev,
                          company_name: e.target.value,
                        }))
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={signupForm.phone}
                      onChange={(e) =>
                        setSignupForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@company.com"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowSignupPassword(!showSignupPassword)
                        }
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Must be at least 8 characters with uppercase, lowercase,
                      and numbers
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 rounded"
                      required
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm leading-relaxed text-slate-600"
                    >
                      I agree to the{" "}
                      <Button
                        variant="link"
                        className="h-auto px-0 text-[#4F46E5] hover:text-[#4338CA]"
                      >
                        Terms of Service
                      </Button>{" "}
                      and{" "}
                      <Button
                        variant="link"
                        className="h-auto px-0 text-[#4F46E5] hover:text-[#4338CA]"
                      >
                        Privacy Policy
                      </Button>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Need help?{" "}
            <Button
              variant="link"
              className="px-0 text-[#4F46E5] hover:text-[#4338CA]"
            >
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
