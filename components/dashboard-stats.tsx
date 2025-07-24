"use client"

import { useEffect, useState } from "react"

import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPropertyStatsClient,
  type PropertyStats,
} from "@/packages/supabase/src/queries/property"

export function DashboardStats() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PropertyStats | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getPropertyStatsClient()
        setStats(data)
      } catch (error) {
        console.error("Failed to load stats:", error)
        setError("Failed to load dashboard <s></s>tats")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="mb-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8 text-center text-red-600">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="mb-8 text-center text-slate-600">
        <p>No data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties.toString(),
      change: `${stats.propertyChangeLastMonth > 0 ? "+" : ""}${
        stats.propertyChangeLastMonth
      } this month`,
      trend:
        stats.propertyChangeLastMonth > 0
          ? "up"
          : stats.propertyChangeLastMonth < 0
            ? "down"
            : "neutral",
      icon: CheckCircle,
    },
    {
      title: "Average Risk Score",
      value: `${stats.averageRiskScore}%`,
      change: `${stats.riskChangeLastMonth > 0 ? "+" : ""}${
        stats.riskChangeLastMonth
      }% from last month`,
      trend:
        stats.riskChangeLastMonth > 0
          ? "up"
          : stats.riskChangeLastMonth < 0
            ? "down"
            : "neutral",
      icon: TrendingDown,
    },
    {
      title: "High Risk Properties",
      value: stats.highRiskCount.toString(),
      change:
        stats.highRiskChangeLastMonth === 0
          ? "Same as last month"
          : `${stats.highRiskChangeLastMonth > 0 ? "+" : ""}${
              stats.highRiskChangeLastMonth
            } from last month`,
      trend:
        stats.highRiskChangeLastMonth > 0
          ? "up"
          : stats.highRiskChangeLastMonth < 0
            ? "down"
            : "neutral",
      icon: AlertTriangle,
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: `${stats.revenueChangeLastMonth > 0 ? "+" : ""}${
        stats.revenueChangeLastMonth
      }% this month`,
      trend:
        stats.revenueChangeLastMonth > 0
          ? "up"
          : stats.revenueChangeLastMonth < 0
            ? "down"
            : "neutral",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stat.value}
            </div>
            <p
              className={`text-xs ${
                stat.trend === "up"
                  ? "text-green-600"
                  : stat.trend === "down"
                    ? "text-red-600"
                    : "text-slate-600"
              }`}
            >
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
