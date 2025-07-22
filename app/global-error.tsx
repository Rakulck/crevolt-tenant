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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
                <div className="bg-slate-100 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">
                    Error Details (Development Only):
                  </h4>
                  <div className="text-sm text-slate-700 space-y-1">
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
                        <pre className="mt-2 text-xs bg-slate-200 p-2 rounded overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={reset}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button onClick={handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>

                <Button onClick={handleReportBug} variant="outline">
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {/* Help Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Need Help?
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
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
                    className="text-[#4F46E5] hover:text-[#4338CA] underline"
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
