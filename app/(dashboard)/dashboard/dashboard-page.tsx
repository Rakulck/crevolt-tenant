"use client"

import { useEffect, useState, Suspense } from "react"
import { ErrorBoundary } from "../../../components/error-boundary"
import { SectionLoading } from "../../../components/loading/section-loading"
import { DashboardHeader } from "../../../components/dashboard-header"
import { DashboardStats } from "../../../components/dashboard-stats"
import { PropertyCard } from "../../../components/property-card"
import { AddPropertyButton } from "../../../components/add-property-button"

export default function Dashboard() {
  const [properties, setProperties] = useState([
    {
      name: "Sunset Apartments - Unit 4B",
      address: "1234 Sunset Blvd, Los Angeles, CA 90028",
      defaultRisk: 12,
      lastUpdated: "2 days ago",
      tenantCount: 1,
    },
    {
      name: "Downtown Loft - Suite 201",
      address: "567 Main St, Downtown, CA 90012",
      defaultRisk: 7,
      lastUpdated: "1 week ago",
      tenantCount: 1,
    },
    {
      name: "Riverside Complex - Building A",
      address: "890 River Rd, Riverside, CA 92501",
      defaultRisk: 23,
      lastUpdated: "3 days ago",
      tenantCount: 8,
    },
  ])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      // Load properties from localStorage on component mount
      const savedProperties = localStorage.getItem("properties")
      if (savedProperties) {
        const parsedProperties = JSON.parse(savedProperties)
        setProperties((prev) => [...prev, ...parsedProperties])
      }
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ErrorBoundary>
          <Suspense fallback={<SectionLoading message="Loading statistics..." />}>
            <DashboardStats />
          </Suspense>
        </ErrorBoundary>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Properties</h2>
          <AddPropertyButton />
        </div>

        <ErrorBoundary>
          {isLoading ? (
            <SectionLoading message="Loading properties..." height="h-96" />
          ) : (
            <div className="space-y-4">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id || index}
                  id={property.id || index.toString()}
                  name={property.name}
                  address={property.address}
                  defaultRisk={property.defaultRisk}
                  lastUpdated={property.lastUpdated}
                  tenantCount={property.tenantCount}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>

        {!isLoading && properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties yet</h3>
            <p className="text-slate-600 mb-4">Get started by adding your first property to track tenant risk.</p>
            <AddPropertyButton />
          </div>
        )}
      </main>
    </div>
  )
}
