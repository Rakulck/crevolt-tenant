"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TenantFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-32" />
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stepper Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                  {step < 3 && <Skeleton className="mx-4 h-0.5 w-16" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content Skeleton */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Form Fields Skeleton */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-8">
                <Skeleton className="h-10 w-20" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
