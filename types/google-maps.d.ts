declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      mapTypeId?: MapTypeId
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    enum MapTypeId {
      HYBRID = "hybrid",
      ROADMAP = "roadmap",
      SATELLITE = "satellite",
      TERRAIN = "terrain",
    }

    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions)
        addListener(eventName: string, handler: () => void): void
        getPlace(): PlaceResult
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds
        componentRestrictions?: ComponentRestrictions
        fields?: string[]
        strictBounds?: boolean
        types?: string[]
      }

      interface ComponentRestrictions {
        country?: string | string[]
      }

      interface PlaceResult {
        address_components?: AddressComponent[]
        formatted_address?: string
        geometry?: PlaceGeometry
        name?: string
        place_id?: string
        types?: string[]
      }

      interface AddressComponent {
        long_name: string
        short_name: string
        types: string[]
      }

      interface PlaceGeometry {
        location?: LatLng
        viewport?: LatLngBounds
      }

      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng)
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void
    }
  }
}

export {}
