"use client"

import type React from "react"

import { useEffect, useRef, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import type { InputProps } from "@/components/ui/input"
import type { google } from "google-maps"

interface AddressAutocompleteProps extends Omit<InputProps, "onChange"> {
  onAddressSelect?: (addressData: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }) => void
  onChange?: (value: string) => void
  countryRestriction?: string
}

export const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  ({ onAddressSelect, onChange, countryRestriction = "us", ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

    useEffect(() => {
      if (!window.google || !inputRef.current) return

      // Initialize autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: countryRestriction },
        fields: ["address_components", "formatted_address", "geometry"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) return

        let streetNumber = ""
        let route = ""
        let city = ""
        let state = ""
        let zipCode = ""
        let country = ""

        place.address_components.forEach((component) => {
          const types = component.types

          if (types.includes("street_number")) {
            streetNumber = component.long_name
          }
          if (types.includes("route")) {
            route = component.long_name
          }
          if (types.includes("locality") || types.includes("sublocality_level_1")) {
            city = component.long_name
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name
          }
          if (types.includes("postal_code")) {
            zipCode = component.long_name
          }
          if (types.includes("country")) {
            country = component.short_name
          }
        })

        const fullAddress = `${streetNumber} ${route}`.trim()

        onAddressSelect?.({
          address: fullAddress,
          city,
          state,
          zipCode,
          country,
        })
      })

      autocompleteRef.current = autocomplete

      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
      }
    }, [onAddressSelect, countryRestriction])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <Input
        {...props}
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        onChange={handleInputChange}
        autoComplete="off"
      />
    )
  },
)

AddressAutocomplete.displayName = "AddressAutocomplete"
