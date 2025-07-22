"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "tenant-pro-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Remove previous theme classes
    root.classList.remove("light", "dark")
    root.removeAttribute("data-theme")

    let resolvedTheme: "light" | "dark"

    if (theme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      resolvedTheme = theme
    }

    // Apply theme
    root.classList.add(resolvedTheme)
    root.setAttribute("data-theme", resolvedTheme)
    setActualTheme(resolvedTheme)

    // Save to localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const resolvedTheme = mediaQuery.matches ? "dark" : "light"
      const root = window.document.documentElement

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
      root.setAttribute("data-theme", resolvedTheme)
      setActualTheme(resolvedTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>{children}</ThemeContext.Provider>
}

// Theme switching utilities
export const themes: { name: Theme; label: string }[] = [
  { name: "light", label: "Light" },
  { name: "dark", label: "Dark" },
  { name: "system", label: "System" },
]

// Custom theme configurations
export const customThemes = {
  // Blue theme (current)
  blue: {
    name: "Blue",
    primary: "#4F46E5",
    primaryHover: "#4338CA",
  },
  // Green theme
  green: {
    name: "Green",
    primary: "#059669",
    primaryHover: "#047857",
  },
  // Purple theme
  purple: {
    name: "Purple",
    primary: "#7C3AED",
    primaryHover: "#6D28D9",
  },
  // Red theme
  red: {
    name: "Red",
    primary: "#DC2626",
    primaryHover: "#B91C1C",
  },
  // Orange theme
  orange: {
    name: "Orange",
    primary: "#EA580C",
    primaryHover: "#C2410C",
  },
}

export function applyCustomTheme(themeName: keyof typeof customThemes) {
  const theme = customThemes[themeName]
  const root = window.document.documentElement

  // Update CSS custom properties
  root.style.setProperty("--primary-500", theme.primary)
  root.style.setProperty("--primary-600", theme.primaryHover)
  root.style.setProperty("--button-primary-bg", theme.primary)
  root.style.setProperty("--button-primary-hover", theme.primaryHover)

  // Save custom theme preference
  localStorage.setItem("tenant-pro-custom-theme", themeName)
}

export function loadCustomTheme() {
  const savedCustomTheme = localStorage.getItem("tenant-pro-custom-theme") as keyof typeof customThemes
  if (savedCustomTheme && customThemes[savedCustomTheme]) {
    applyCustomTheme(savedCustomTheme)
  }
} 