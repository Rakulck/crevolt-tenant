// Server actions (secure mutations)
export {
  createTenant,
  createTenantsBulk,
  deleteTenant,
  updateTenant,
} from "./tenant-server"

// Client functions (data fetching)
export {
  getPropertyTenantRiskAnalysis,
  getPropertyTenants,
  getTenantById,
  getUserPropertiesRiskSummary,
  getUserTenants,
  subscribeToPropertyTenants,
  subscribeToUserTenants,
} from "./tenant-client"

// Types from tenant-server
export type {
  CreateTenantData,
  Tenant,
  UpdateTenantData,
} from "./tenant-server"

// Types from tenant-client
export type { PropertyRiskSummary, TenantRiskData } from "./tenant-client"
