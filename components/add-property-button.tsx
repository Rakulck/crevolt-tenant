"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function AddPropertyButton() {
  const router = useRouter()

  return (
    <Button
      className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
      onClick={() => router.push("/dashboard/add-property")}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Property
    </Button>
  )
}
