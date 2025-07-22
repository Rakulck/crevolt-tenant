"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AddPropertyButton() {
  const router = useRouter()

  return (
    <Button
      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
      onClick={() => router.push("/dashboard/add-property")}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Property
    </Button>
  )
}
