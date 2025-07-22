"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, Building2, Mail, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsEmailSent(true)
    }, 2000)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              TenantPro Analytics
            </h1>
            <p className="text-slate-600 mt-2">
              Professional Tenant Analysis Platform
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-1 pb-4">
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
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Email sent to:</strong>
                </p>
                <p className="text-slate-900 font-medium">{email}</p>
              </div>

              <div className="space-y-4">
                <div className="text-center text-sm text-slate-600">
                  <p>Didn't receive the email? Check your spam folder or</p>
                </div>

                <Button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-11 bg-transparent"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4F46E5] mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Resend Email
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => router.push("/auth")}
                  variant="ghost"
                  className="w-full h-11"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
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

          <div className="text-center mt-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            TenantPro Analytics
          </h1>
          <p className="text-slate-600 mt-2">
            Professional Tenant Analysis Platform
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-slate-900">
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
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => router.push("/auth")}
                variant="ghost"
                className="w-full h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
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
