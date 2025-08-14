import { NextRequest, NextResponse } from "next/server"
import { createServerClientFromEnv } from "@/packages/supabase/src/clients/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
      "application/pdf", // .pdf
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload Excel, CSV, or PDF files." },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 10MB." },
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

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `rent-roll-parser-${timestamp}.${fileExtension}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("rent-rolls")
      .upload(`parser/${uniqueFilename}`, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("rent-rolls")
      .getPublicUrl(`parser/${uniqueFilename}`)

    // Simulate processing (in production, this would call your actual processing service)
    const processingResult = await simulateRentRollProcessing(file)

    // Save processing metadata
    const { data: metadataData, error: metadataError } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        document_type: "rent_roll_parser",
        original_filename: file.name,
        stored_filename: uniqueFilename,
        storage_bucket: "rent-rolls",
        storage_path: `parser/${uniqueFilename}`,
        storage_url: urlData.publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
        file_status: "processed",
        file_metadata: {
          ...processingResult,
          parsedAt: new Date().toISOString(),
        },
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (metadataError) {
      console.error("Metadata save error:", metadataError)
      return NextResponse.json(
        { success: false, error: "Failed to save processing metadata" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: metadataData.id,
        processingResult,
        downloadUrl: urlData.publicUrl,
      },
    })

  } catch (error) {
    console.error("Rent roll parser error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process rent roll",
      },
      { status: 500 }
    )
  }
}

async function simulateRentRollProcessing(file: File) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Return mock processing results
  return {
    totalUnits: Math.floor(Math.random() * 50) + 10,
    extractedTenants: Math.floor(Math.random() * 45) + 8,
    processingTimeMs: Math.floor(Math.random() * 3000) + 1000,
    propertiesFound: Math.floor(Math.random() * 5) + 1,
    totalRent: `$${(Math.floor(Math.random() * 50000) + 20000).toLocaleString()}`,
    sheets: [
      {
        name: "Sheet1",
        unitsFound: Math.floor(Math.random() * 30) + 5,
        confidence: 0.95,
      },
    ],
    excelOutputGenerated: true,
  }
}
