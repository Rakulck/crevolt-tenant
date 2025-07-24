// Server actions (secure mutations)
export {
  createProperty,
  deleteProperty,
  getPropertyById,
  updateProperty,
  type Property,
  type PropertyResult,
  type PropertyStats,
} from "./property-server"

// Client functions (data fetching)
export {
  getPropertyStatsClient,
  getUserProperties,
  getUserPropertiesWithStats,
} from "./property-client"

// Types
export type { CreatePropertyData, UpdatePropertyData } from "./property-server"
