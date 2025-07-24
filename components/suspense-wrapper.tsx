"use client"

import React, { Suspense } from "react"

import { ErrorBoundary } from "./error-boundary"

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export function SuspenseWrapper({
  children,
  fallback,
  errorFallback,
}: SuspenseWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}
