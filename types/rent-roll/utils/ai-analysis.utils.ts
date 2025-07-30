import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import {
  type HeaderAnalysisResult,
  HeaderAnalysisSchema,
  type SheetClassificationResult,
  SheetClassificationSchema,
} from "../types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeHeaders(
  sheetData: unknown[][],
  maxRows = 100,
): Promise<HeaderAnalysisResult> {
  const analysisData = sheetData.slice(0, maxRows)

  const formattedData = analysisData
    .map(
      (row, index) =>
        `Row ${index + 1}: ${row
          .map(
            (cell, colIndex) =>
              `${String.fromCharCode(65 + colIndex)}="${cell || ""}"`,
          )
          .join(", ")}`,
    )
    .join("\n")

  const prompt = `Analyze this spreadsheet data to identify rent roll headers and determine where data extraction should begin.

Data (first ${maxRows} rows):
${formattedData}

Tasks:
1. Find the row containing column headers for rent roll data
2. Identify which columns contain the required fields
3. Determine the row where actual unit data begins (may be different from header row)
4. Provide confidence score (0-1) based on header clarity and data structure

Look for these field variations:
- unit_number: "Unit", "Unit #", "Apt", "Apartment", "Suite", "Unit Number"
- floor_plan: "Floor Plan", "Unit Type", "Layout", "Type", "Plan", "Beds/Baths"
- square_footage: "SQFT", "SF", "Square Feet", "Size", "Square Footage", "Area"
- current_rent: "Rent", "Current Rent", "Monthly Rent", "Rent Amount", "Actual Rent"
- lease_start: "Lease Start", "Move In", "Start Date", "Move-In Date", "Lease Begin"
- lease_end: "Lease End", "Lease Expiration", "End Date", "Expiration", "Lease Expire"
- occupancy_status: "Status", "Unit Status", "Occupied", "Occupancy", "Vacancy Status"
- market_rent: "Market Rent", "Market Rate", "Market + Addl", "Market", "Asking Rent"
- tenant_name: "Name", "Tenant", "Resident", "Tenant Name", "Lessee"

Return column letters (A, B, C, etc.) and row numbers (1-based).`

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst specialized in rent roll spreadsheet analysis. Analyze the provided data and identify header locations, column mappings, and data start positions with high accuracy.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: zodResponseFormat(
        HeaderAnalysisSchema,
        "headerAnalysis",
      ),
    })

    const result = completion.choices[0]?.message.parsed
    if (!result) {
      throw new Error("Failed to parse AI response")
    }

    return result
  } catch (error) {
    console.error("AI header analysis failed:", error)
    throw new Error(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function classifySheet(
  sheetName: string,
  firstRows: unknown[][],
  maxRows = 20,
): Promise<SheetClassificationResult> {
  const sampleData = firstRows
    .slice(0, maxRows)
    .map((row, index) => `Row ${index + 1}: ${row.join(", ")}`)
    .join("\n")

  const prompt = `Analyze this spreadsheet data to classify the sheet type.

Sheet Name: "${sheetName}"
Data Sample:
${sampleData}

Classify as:
- "rent_roll": Contains individual unit data with columns like unit numbers, rents, tenant names
- "summary": Contains summary/aggregate data, totals, or property-level information
- "unknown": Cannot determine or doesn't fit above categories

If it's a rent roll, try to extract the property name from the sheet name or data.
Provide confidence score (0-1).`

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst that classifies spreadsheet content based on rent roll analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: zodResponseFormat(
        SheetClassificationSchema,
        "sheetClassification",
      ),
    })

    const result = completion.choices[0]?.message.parsed
    if (!result) {
      throw new Error("Failed to parse AI response")
    }

    return result
  } catch (error) {
    console.error("Sheet classification failed:", error)
    return { type: "unknown", confidence: 0, propertyName: null }
  }
}
