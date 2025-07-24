"use client"

import { CheckCircle } from "lucide-react"

interface SuccessMessageProps {
  message: string
  isVisible: boolean
}

export function SuccessMessage({ message, isVisible }: SuccessMessageProps) {
  if (!isVisible) return null

  return (
    <div className="mt-4 rounded-md border border-[#4F46E5]/20 bg-[#4F46E5]/10 p-3 duration-300 animate-in fade-in-0">
      <div className="flex items-center">
        <CheckCircle className="mr-2 h-4 w-4 text-[#4F46E5]" />
        <p className="text-sm font-medium text-[#4F46E5]">{message}</p>
      </div>
    </div>
  )
}
