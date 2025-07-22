"use client"

import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 text-6xl font-bold text-slate-400">404</div>
          <CardTitle className="text-2xl font-bold text-slate-900">Page Not Found</CardTitle>
          <CardDescription className="text-lg">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="bg-slate-100 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Looking for something specific?</h4>
            <ul className="text-sm text-slate-600 space-y-1 text-left">
              <li>
                •{" "}
                <a href="/dashboard" className="text-[#4F46E5] hover:underline">
                  Dashboard
                </a>{" "}
                - View your properties
              </li>
              <li>
                •{" "}
                <a href="/dashboard/add-property" className="text-[#4F46E5] hover:underline">
                  Add Property
                </a>{" "}
                - Add a new property
              </li>
              <li>
                •{" "}
                <a href="/dashboard/add-tenant" className="text-[#4F46E5] hover:underline">
                  Add Tenant
                </a>{" "}
                - Add tenant information
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
