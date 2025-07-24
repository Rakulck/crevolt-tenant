"use client"

import { LoadingSpinner } from "./loading/loading-spinner"

export function LoadingGoogleMaps() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="space-y-2 text-center">
        <LoadingSpinner size="sm" />
        <p className="text-sm text-slate-600">Loading Google Maps...</p>
      </div>
    </div>
  )
}
