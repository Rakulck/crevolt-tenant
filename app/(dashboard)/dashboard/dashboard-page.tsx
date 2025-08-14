"use client"

import { Suspense, useEffect, useState } from "react"

import {
  getUserPropertiesWithStats,
  type Property,
} from "@/packages/supabase/src/queries/property"

import { AddPropertyButton } from "../../../components/add-property-button"
import { DashboardHeader } from "../../../components/dashboard-header"
import { DashboardStats } from "../../../components/dashboard-stats"
import { ErrorBoundary } from "../../../components/error-boundary"
import { SectionLoading } from "../../../components/loading/section-loading"
import { PropertyCard } from "../../../components/property-card"

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Loading user properties...")

      const userProperties = await getUserPropertiesWithStats()
      console.log("Loaded properties:", userProperties)

      setProperties(userProperties)
    } catch (error) {
      console.error("Failed to load properties:", error)
      setError("Failed to load properties. Please refresh the page.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  const formatAddress = (property: Property) => {
    const { address } = property
    return `${address.street_address}, ${address.city}${address.state ? `, ${address.state}` : ""}${address.zip_code ? ` ${address.zip_code}` : ""}`
  }

  const getLastUpdated = (updatedAt: string) => {
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffInMs = now.getTime() - updated.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <ErrorBoundary>
          <Suspense
            fallback={<SectionLoading message="Loading statistics..." />}
          >
            <DashboardStats />
          </Suspense>
        </ErrorBoundary>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Your Properties</h2>
          <AddPropertyButton />
        </div>

        <ErrorBoundary>
          {isLoading ? (
            <SectionLoading message="Loading properties..." height="h-96" />
          ) : error ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-red-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">
                Error Loading Properties
              </h3>
              <p className="mb-4 text-slate-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-[#4F46E5] hover:text-[#4338CA]"
              >
                Try Again
              </button>
            </div>
          ) : properties.length > 0 ? (
            <div className="space-y-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  name={property.name}
                  address={formatAddress(property)}
                  defaultRisk={(property as any).averageRisk || 0}
                  lastUpdated={getLastUpdated(property.updated_at)}
                  tenantCount={(property as any).tenantCount || 0}
                  onPropertyDeleted={loadProperties}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-4 text-slate-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">
                No properties yet
              </h3>
              <p className="mb-4 text-slate-600">
                Get started by adding your first property to track tenant risk.
              </p>
              <AddPropertyButton />
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  )
}
