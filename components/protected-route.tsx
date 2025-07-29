"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useAuth } from "../hooks/use-auth"

import { PageLoading } from "./loading/page-loading"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return fallback || <PageLoading message="Verifying authentication..." />
  }

  // Show loading while redirecting
  if (!user) {
    return fallback || <PageLoading message="Redirecting to login..." />
  }

  // User is authenticated, render children
  return <>{children}</>
}
