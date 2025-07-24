"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PropertyFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-32" />
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="mb-4 flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-6">
                <div className="mb-4 flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-11 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 border-t border-slate-200 pt-6">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
