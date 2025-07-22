"use client"

import { useState } from "react"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { customThemes, applyCustomTheme } from "@/lib/theme"

export function ThemeCustomizer() {
  const [selectedTheme, setSelectedTheme] =
    useState<keyof typeof customThemes>("blue")
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (themeName: keyof typeof customThemes) => {
    setSelectedTheme(themeName)
    applyCustomTheme(themeName)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Theme</DialogTitle>
          <DialogDescription>
            Choose your preferred color scheme for the application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(customThemes).map(([key, theme]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTheme === key ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  handleThemeChange(key as keyof typeof customThemes)
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="font-medium">{theme.name}</span>
                    </div>
                    {selectedTheme === key && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Your theme preference will be saved automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
