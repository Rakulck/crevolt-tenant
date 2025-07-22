"use client"

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardStats() {
  const stats = [
    {
      title: "Total Properties",
      value: "12",
      change: "+2 this month",
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Average Risk Score",
      value: "14%",
      change: "-3% from last month",
      trend: "down",
      icon: TrendingDown,
    },
    {
      title: "High Risk Properties",
      value: "3",
      change: "Same as last month",
      trend: "neutral",
      icon: AlertTriangle,
    },
    {
      title: "Total Revenue",
      value: "$24,500",
      change: "+12% this month",
      trend: "up",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
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
