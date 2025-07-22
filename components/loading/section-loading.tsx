"use client"

import { LoadingSpinner } from "./loading-spinner"
import { Card, CardContent } from "@/components/ui/card"

interface SectionLoadingProps {
  message?: string
  height?: string
}

export function SectionLoading({ message = "Loading...", height = "h-64" }: SectionLoadingProps) {
  return (
    <Card>
      <CardContent className={`flex items-center justify-center ${height}`}>
        <div className="text-center space-y-3">
          <LoadingSpinner />
          <p className="text-slate-600">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
