"use client"

import { LoadingSpinner } from "./loading/loading-spinner"

export function LoadingGoogleMaps() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <LoadingSpinner size="sm" />
        <p className="text-sm text-slate-600">Loading Google Maps...</p>
      </div>
    </div>
  )
}
