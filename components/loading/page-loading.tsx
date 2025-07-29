"use client"

import { LoadingSpinner } from "./loading-spinner"

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="space-y-4 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-lg text-slate-600">{message}</p>
      </div>
    </div>
  )
}
