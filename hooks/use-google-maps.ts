"use client"

import { useState, useEffect } from "react"

interface UseGoogleMapsOptions {
  apiKey?: string
  libraries?: string[]
}

export function useGoogleMaps({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  libraries = ["places"],
}: UseGoogleMapsOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    if (!apiKey) {
      setError("Google Maps API key is required")
      return
    }

    const script = document.createElement("script")
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(",")}` : ""
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}`
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
      setError(null)
    }

    script.onerror = () => {
      setError("Failed to load Google Maps API")
      setIsLoaded(false)
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript)
      }
    }
  }, [apiKey, libraries])

  return { isLoaded, error }
}
