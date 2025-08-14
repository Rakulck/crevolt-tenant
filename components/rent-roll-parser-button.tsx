"use client"

import { FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function RentRollParserButton() {
  const router = useRouter()

  return (
    <Button
      className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
      onClick={() => router.push("/dashboard/rent-roll-parser")}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Rent Roll Parser
    </Button>
  )
}
