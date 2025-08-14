import { NextRequest, NextResponse } from "next/server"
import { createServerClientFromEnv } from "@/packages/supabase/src/clients/server"

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerClientFromEnv()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get file metadata
    const { data: fileData, error: fileError } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      )
    }

    // Generate Excel file content (in production, this would use a library like ExcelJS)
    const excelContent = generateExcelContent(fileData.file_metadata)

    // Create response with Excel file
    const response = new NextResponse(excelContent, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="processed-rent-roll-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })

    return response

  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate download",
      },
      { status: 500 }
    )
  }
}

function generateExcelContent(metadata: any) {
  // This is a placeholder - in production, you would use ExcelJS or similar library
  // to generate actual Excel files with the processed data
  
  // For now, return a simple CSV-like structure that Excel can open
  const headers = [
    "Property Name",
    "Unit Number", 
    "Tenant Name",
    "Monthly Rent",
    "Lease Start Date",
    "Lease End Date",
    "Status"
  ]

  const sampleData = [
    ["Sample Property 1", "101", "John Doe", "$1,200", "2024-01-01", "2024-12-31", "Active"],
    ["Sample Property 1", "102", "Jane Smith", "$1,300", "2024-02-01", "2025-01-31", "Active"],
    ["Sample Property 2", "201", "Bob Johnson", "$1,500", "2024-03-01", "2025-02-28", "Active"],
  ]

  const csvContent = [
    headers.join(","),
    ...sampleData.map(row => row.join(","))
  ].join("\n")

  // Convert CSV to a simple Excel-like format
  // In production, use ExcelJS for proper Excel generation
  return csvContent
}
