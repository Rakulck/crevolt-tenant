"use client"

import { useEffect } from "react"

interface GoogleMapsScriptProps {
  onLoad?: () => void
}

export function GoogleMapsScript({ onLoad }: GoogleMapsScriptProps) {
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      onLoad?.()
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      onLoad?.()
    }

    script.onerror = () => {
      console.error("Failed to load Google Maps API")
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [onLoad])

  return null
}
