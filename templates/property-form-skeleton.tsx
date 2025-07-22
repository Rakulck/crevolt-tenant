"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PropertyFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
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
                <div className="flex items-center space-x-2 mb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
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
