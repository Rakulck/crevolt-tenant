"use client"

import { useEffect } from "react"

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Page error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an error while loading this page. Please try again or
            go back to the previous page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded bg-slate-100 p-3 text-sm">
              <strong>Error:</strong> {error.message}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={reset}
              className="flex-1 bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
