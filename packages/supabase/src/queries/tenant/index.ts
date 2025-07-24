// Server actions (secure mutations)
export {
  createTenant,
  createTenantsBulk,
  deleteTenant,
  updateTenant,
} from "./tenant-server"

// Client functions (data fetching)
export {
  getPropertyTenants,
  getTenantById,
  getUserTenants,
  subscribeToPropertyTenants,
  subscribeToUserTenants,
} from "./tenant-client"

// Types
export type {
  CreateTenantData,
  Tenant,
  UpdateTenantData,
} from "./tenant-server"
