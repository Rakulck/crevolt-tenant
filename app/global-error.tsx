"use client"

import { useEffect } from "react"

import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error)
  }, [error])

  const handleGoHome = () => {
    window.location.href = "/dashboard"
  }

  const handleReportBug = () => {
    // In a real app, this would open a bug report form or send to error tracking
    const subject = encodeURIComponent("Bug Report: Application Error")
    const body = encodeURIComponent(`
Error Message: ${error.message}
Error Digest: ${error.digest || "N/A"}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `)
    window.open(`mailto:support@tenantpro.com?subject=${subject}&body=${body}`)
  }

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Something went wrong!
              </CardTitle>
              <CardDescription className="text-lg">
                We're sorry, but an unexpected error has occurred. Our team has
                been notified and is working to fix the issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-lg bg-slate-100 p-4">
                  <h4 className="mb-2 font-medium text-slate-900">
                    Error Details (Development Only):
                  </h4>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Message:</strong> {error.message}
                    </p>
                    {error.digest && (
                      <p>
                        <strong>Digest:</strong> {error.digest}
                      </p>
                    )}
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-200 p-2 text-xs">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  onClick={reset}
                  className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button onClick={handleGoHome} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button onClick={handleReportBug} variant="outline">
                  <Bug className="mr-2 h-4 w-4" />
                  Report Bug
                </Button>
              </div>

              {/* Help Information */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-blue-900">
                      Need Help?
                    </h4>
                    <p className="mb-3 text-sm text-blue-700">
                      If this error persists, please contact our support team.
                      Include the error details above if possible.
                    </p>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p>
                        <strong>Email:</strong> support@tenantpro.com
                      </p>
                      <p>
                        <strong>Phone:</strong> 1-800-TENANT-PRO
                      </p>
                      <p>
                        <strong>Error ID:</strong> {error.digest || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="text-center text-sm text-slate-500">
                <p>Error occurred at: {new Date().toLocaleString()}</p>
                <p className="mt-1">
                  Check our{" "}
                  <a
                    href="https://status.tenantpro.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4F46E5] underline hover:text-[#4338CA]"
                  >
                    status page
                  </a>{" "}
                  for any ongoing issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
