"use client"

import React, { forwardRef, useEffect, useRef } from "react"

import { Input } from "@/components/ui/input"

interface AddressAutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onAddressSelect?: (addressData: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    // Additional info for debugging/fallback
    components: {
      streetNumber?: string
      route?: string
      neighborhood?: string
      locality?: string
      sublocality?: string
      administrativeAreaLevel1?: string
      administrativeAreaLevel2?: string
      postalCode?: string
      country?: string
    }
  }) => void
  onChange?: (value: string) => void
  countryRestriction?: string // Optional: restrict to specific country (e.g., "us", "ca"), defaults to worldwide
  placeholder?: string
}

export const AddressAutocomplete = forwardRef<
  HTMLInputElement,
  AddressAutocompleteProps
>(
  (
    {
      onAddressSelect,
      onChange,
      countryRestriction, // Remove default "us" to allow worldwide addresses
      placeholder = "Enter address...",
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const autocompleteRef = useRef<any>(null)

    useEffect(() => {
      if (!window.google || !inputRef.current) return

      // Initialize autocomplete with enhanced options
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          // Only restrict country if specifically provided, otherwise allow worldwide
          ...(countryRestriction && {
            componentRestrictions: { country: countryRestriction },
          }),
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "place_id",
            "name",
          ],
        },
      )

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) {
          console.warn("No address components found for selected place")
          return
        }

        // Initialize all possible address components
        let streetNumber = ""
        let route = ""
        let neighborhood = ""
        let locality = ""
        let sublocality = ""
        let administrativeAreaLevel1 = ""
        let administrativeAreaLevel2 = ""
        let postalCode = ""
        let country = ""
        let countryCode = ""

        // Parse all address components
        place.address_components.forEach((component) => {
          const { types, long_name, short_name } = component

          if (types.includes("street_number")) {
            streetNumber = long_name
          }
          if (types.includes("route")) {
            route = long_name
          }
          if (types.includes("neighborhood")) {
            neighborhood = long_name
          }
          if (types.includes("locality")) {
            locality = long_name
          }
          if (
            types.includes("sublocality_level_1") ||
            types.includes("sublocality")
          ) {
            sublocality = long_name
          }
          if (types.includes("administrative_area_level_1")) {
            administrativeAreaLevel1 = short_name // State/Province abbreviation
          }
          if (types.includes("administrative_area_level_2")) {
            administrativeAreaLevel2 = long_name // County
          }
          if (types.includes("postal_code")) {
            postalCode = long_name
          }
          if (types.includes("country")) {
            country = long_name
            countryCode = short_name
          }
        })

        // Build street address with fallbacks
        const fullAddress = `${streetNumber} ${route}`.trim()

        // Smart city detection with fallbacks
        let finalCity =
          locality || sublocality || neighborhood || administrativeAreaLevel2

        // State handling with fallbacks
        const finalState = administrativeAreaLevel1

        // Country handling
        const finalCountry = countryCode || country

        // Handle missing data gracefully
        if (!finalCity) {
          console.warn(
            "City not found in address components, using formatted address fallback",
          )
          // Try to extract city from formatted address as fallback
          const addressParts = place.formatted_address?.split(", ") || []
          if (addressParts.length >= 2) {
            finalCity = addressParts[addressParts.length - 3] || ""
          }
        }

        if (!postalCode) {
          console.warn("Postal code not found for this address")
          // Some locations don't have postal codes, this is acceptable
        }

        if (!finalState) {
          console.warn("State/Province not found for this address")
          // Some countries/regions don't have states, this is acceptable
        }

        // Note: Coordinates removed as they're not needed for this application

        // Create detailed address data
        const addressData = {
          address: fullAddress || place.name || "",
          city: finalCity || "",
          state: finalState || "",
          zipCode: postalCode || "",
          country: finalCountry || "",
          components: {
            streetNumber: streetNumber || undefined,
            route: route || undefined,
            neighborhood: neighborhood || undefined,
            locality: locality || undefined,
            sublocality: sublocality || undefined,
            administrativeAreaLevel1: administrativeAreaLevel1 || undefined,
            administrativeAreaLevel2: administrativeAreaLevel2 || undefined,
            postalCode: postalCode || undefined,
            country: country || undefined,
          },
        }

        console.log("Address parsed:", addressData)

        onAddressSelect?.(addressData)
      })

      autocompleteRef.current = autocomplete

      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(
            autocompleteRef.current,
          )
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
        placeholder={placeholder}
        autoComplete="off"
      />
    )
  },
)

AddressAutocomplete.displayName = "AddressAutocomplete"
