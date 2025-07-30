"use client"

import { ProtectedRoute } from "../../../components/protected-route"

import Dashboard from "./dashboard-page"

// Prevent static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
