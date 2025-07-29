// Server actions (secure mutations)
export {
  updateDashboardPreferences,
  updateNotificationPreferences,
  updateProfile,
} from "./profile-server"

// Client functions (real-time data)
export { getProfileClient, subscribeToProfile } from "./profile-client"

// Types
export type { ProfileUpdateData, UserProfile } from "./profile-server"
