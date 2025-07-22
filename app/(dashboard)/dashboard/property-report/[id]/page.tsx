"use client"

import PropertyReportPage from "./property-report-page"

export default function Page({ params }: { params: { id: string } }) {
  return <PropertyReportPage propertyId={params.id} />
}
