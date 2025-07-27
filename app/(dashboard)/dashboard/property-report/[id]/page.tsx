"use client"

import { use } from "react"

import PropertyReportPage from "./property-report-page"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PropertyReportPage propertyId={id} />
}
