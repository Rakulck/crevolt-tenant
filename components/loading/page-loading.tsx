"use client"

import { LoadingSpinner } from "./loading-spinner"

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-600 text-lg">{message}</p>
      </div>
    </div>
  )
}
