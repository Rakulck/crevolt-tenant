"use client"

import { Card, CardContent } from "@/components/ui/card"

import { LoadingSpinner } from "./loading-spinner"

interface SectionLoadingProps {
  message?: string
  height?: string
}

export function SectionLoading({
  message = "Loading...",
  height = "h-64",
}: SectionLoadingProps) {
  return (
    <Card>
      <CardContent className={`flex items-center justify-center ${height}`}>
        <div className="space-y-3 text-center">
          <LoadingSpinner />
          <p className="text-slate-600">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
