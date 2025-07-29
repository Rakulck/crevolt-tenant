import type React from "react"

import { Inter } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/lib/theme"

import type { Metadata } from "next"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TenantPro Analytics",
  description: "Professional Tenant Analysis Platform",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light" storageKey="tenant-pro-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
