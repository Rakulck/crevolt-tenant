"use client"

import { Building2, FileText, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAuth } from "../hooks/use-auth"

import { RentRollParserButton } from "./rent-roll-parser-button"

export function DashboardHeader() {
  const router = useRouter()
  const { user: _user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-[#4F46E5]" />
            <h1 className="text-2xl font-bold text-slate-900">
              Tenant Default Risk Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <RentRollParserButton />
          <Button
            className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            onClick={() => router.push("/dashboard/lease-templates")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Lease Agreement
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-500 bg-slate-500 text-white hover:bg-slate-600"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
