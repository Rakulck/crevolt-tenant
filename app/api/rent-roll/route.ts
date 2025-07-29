import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import {
  saveRentRollMetadata,
  type SaveRentRollData,
} from "@/packages/supabase/src/buckets/rent-rolls/rent-roll-actions"

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as SaveRentRollData
    const result = await saveRentRollMetadata(data)

    if (result.success) {
      // Revalidate relevant paths
      revalidatePath("/dashboard/add-tenant")
      revalidatePath("/dashboard")
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in rent roll API:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process rent roll",
      },
      { status: 500 },
    )
  }
}
