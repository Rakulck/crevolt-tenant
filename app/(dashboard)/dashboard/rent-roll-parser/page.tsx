"use client"

import { ProtectedRoute } from "../../../../components/protected-route"

import RentRollParserPage from "./rent-roll-parser-page"

// Prevent static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function RentRollParser() {
  return (
    <ProtectedRoute>
      <RentRollParserPage />
    </ProtectedRoute>
  )
}
