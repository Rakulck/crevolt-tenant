// Server actions (secure mutations)
export {
  createProperty,
  deleteProperty,
  updateProperty,
  type Property,
  type PropertyStats,
} from "./property-server"

// Client functions (data fetching)
export {
  getPropertyById,
  getPropertyStatsClient,
  getUserProperties,
  getUserPropertiesWithStats,
} from "./property-client"

// Types
export type { CreatePropertyData, UpdatePropertyData } from "./property-server"
