"use client"

import React, { useState } from "react"

import { ArrowLeft, Building2, CheckCircle, Mail, Send } from "lucide-react"
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append("email", email)

    try {
      const { resetPassword } = await import(
        "../../../packages/supabase/src/queries/auth"
      )
      const result = await resetPassword(formData)

      if (result.success) {
        setIsEmailSent(true)
      } else {
        // Show error but don't reveal if email exists for security
        setIsEmailSent(true)
      }
    } catch (error) {
      console.error("Reset password error:", error)
      // Show success message anyway for security
      setIsEmailSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Show success message or update UI
    }, 2000)
  }

  if (isEmailSent) {
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
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-slate-900">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-slate-600">
                We've sent a verification code to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="mb-2 text-sm text-slate-700">
                  <strong>Email sent to:</strong>
                </p>
                <p className="font-medium text-slate-900">{email}</p>
              </div>

              <div className="space-y-4">
                <div className="text-center text-sm text-slate-600">
                  <p>Didn't receive the email? Check your spam folder or</p>
                </div>

                <Button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="h-11 w-full bg-transparent"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[#4F46E5]" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Resend Email
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => router.push("/auth")}
                  variant="ghost"
                  className="h-11 w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Mail className="mt-0.5 h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-blue-900">
                      Next Steps
                    </h4>
                    <p className="text-sm text-blue-700">
                      Click the link in your email to reset your password. The
                      link will expire in 15 minutes for security.
                    </p>
                  </div>
                </div>
              </div>
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
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Enter your email address and we'll send you a verification code to
              reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="h-11 w-full bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => router.push("/auth")}
                variant="ghost"
                className="h-11 w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Remember your password?{" "}
            <Button
              variant="link"
              onClick={() => router.push("/auth")}
              className="px-0 text-[#4F46E5] hover:text-[#4338CA]"
            >
              Sign In
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
