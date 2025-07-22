"use client"

import { CheckCircle } from "lucide-react"

interface SuccessMessageProps {
  message: string
  isVisible: boolean
}

export function SuccessMessage({ message, isVisible }: SuccessMessageProps) {
  if (!isVisible) return null

  return (
    <div className="mt-4 p-3 bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-md animate-in fade-in-0 duration-300">
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-[#4F46E5] mr-2" />
        <p className="text-sm text-[#4F46E5] font-medium">{message}</p>
      </div>
    </div>
  )
}
