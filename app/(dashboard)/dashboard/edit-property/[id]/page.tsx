"use client"

import { use } from "react"

import EditPropertyPage from "./edit-property-page"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditPropertyPage propertyId={id} />
}
