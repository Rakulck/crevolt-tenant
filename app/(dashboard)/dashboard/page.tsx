"use client"

import { ProtectedRoute } from "../../../components/protected-route"

import Dashboard from "./dashboard-page"

export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
