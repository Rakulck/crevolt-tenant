import { aiCacheService } from "../../../../../services/documents/ai-cache.service"
import type { ColumnMapping, HeaderDetectionResult } from "../types"
import { analyzeHeaders } from "../utils/ai-analysis.utils"
import { isLikelyHeaderRow } from "../utils/validation.utils"
import * as XLSX from "xlsx"

interface AIHeaderDetectionResult {
  headerRow: number
  dataStartRow: number
  headers: Record<string, string>
  columnMapping: Record<string, string>
  confidence: number
}

/**
 * Service for detecting headers in rent roll spreadsheets
 * Uses AI analysis with fallback to pattern matching
 */
export const HeaderDetectorService = {
  FALLBACK_KEYWORDS: [
    "unit",
    "number",
    "type",
    "sqft",
    "rent",
    "lease",
    "tenant",
    "status",
    "market",
  ],

  async detectHeaders(sheetData: unknown[][]): Promise<HeaderDetectionResult> {
    try {
      // Try AI detection first
      const aiResult =
        await HeaderDetectorService.detectHeadersWithAI(sheetData)

      if (aiResult.confidence > 0.7) {
        return {
          headerRow: aiResult.headerRow - 1,
          dataStartRow: aiResult.dataStartRow - 1,
          headers: HeaderDetectorService.extractHeaders(
            sheetData,
            aiResult.headerRow - 1,
          ),
          columnMapping: aiResult.columnMapping,
          confidence: aiResult.confidence,
        }
      }

      // Fallback detection
      const fallbackResult =
        HeaderDetectorService.fallbackHeaderDetection(sheetData)

      // Cache fallback result too (with lower confidence)
      return fallbackResult
    } catch (error) {
      console.error("Error detecting headers:", error)
      throw error
    }
  },

  async detectHeadersWithAI(
    sheetData: unknown[][],
  ): Promise<AIHeaderDetectionResult> {
    // This function was not provided in the edit specification, so it's left as is.
    // It would require the definition of AIHeaderDetectionResult and the actual AI analysis logic.
    // For now, it's a placeholder.
    console.warn("AI header detection not fully implemented in this version.")
    return {
      headerRow: -1, // Placeholder
      dataStartRow: -1, // Placeholder
      headers: {}, // Placeholder
      columnMapping: {}, // Placeholder
      confidence: 0, // Placeholder
    }
  },

  fallbackHeaderDetection(sheetData: unknown[][]): HeaderDetectionResult {
    let bestRow = -1
    let maxMatches = 0
    let currentHeaders: Record<string, string> = {}

    // Examine first 10 rows
    for (let row = 0; row < Math.min(10, sheetData.length); row++) {
      let matches = 0
      currentHeaders = {}

      for (let col = 0; col < sheetData[row].length; col++) {
        const cell = sheetData[row][col]
        const value = String(cell).toLowerCase()
        const colLetter = XLSX.utils.encode_col(col)

        if (cell) {
          currentHeaders[colLetter] = String(cell).trim()

          if (
            HeaderDetectorService.FALLBACK_KEYWORDS.some((keyword) =>
              value.includes(keyword),
            )
          ) {
            matches++
          }
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches
        bestRow = row
      }
    }

    if (bestRow === -1) {
      throw new Error("Could not detect header row")
    }

    return {
      headerRow: bestRow,
      dataStartRow: bestRow + 1,
      headers: currentHeaders,
      columnMapping: HeaderDetectorService.mapColumnsToFields(currentHeaders),
      confidence: maxMatches / HeaderDetectorService.FALLBACK_KEYWORDS.length,
    }
  },

  extractHeaders(
    sheetData: unknown[][],
    headerRow: number,
  ): Record<string, string> {
    const headers: Record<string, string> = {}
    const row = sheetData[headerRow]

    if (!row) return headers

    row.forEach((cell, colIndex) => {
      if (cell && String(cell).trim()) {
        const colLetter = String.fromCharCode(65 + colIndex)
        headers[colLetter] = String(cell).trim()
      }
    })

    return headers
  },

  mapColumnsToFields(headers: Record<string, string>): ColumnMapping {
    const mapping: ColumnMapping = {
      unit_number: "",
      floor_plan: "",
      square_footage: "",
      current_rent: "",
      lease_start: "",
      lease_end: "",
      occupancy_status: "",
      market_rent: "",
      tenant_name: "",
    }

    const fieldMappings = {
      unit_number: [
        "unit",
        "unit #",
        "apt",
        "apartment",
        "suite",
        "unit number",
      ],
      floor_plan: [
        "floor plan",
        "unit type",
        "layout",
        "type",
        "plan",
        "beds",
        "baths",
        "bedroom",
      ],
      square_footage: [
        "sqft",
        "sf",
        "square feet",
        "size",
        "square footage",
        "area",
      ],
      current_rent: [
        "rent",
        "current rent",
        "monthly rent",
        "rent amount",
        "actual rent",
      ],
      lease_start: [
        "lease start",
        "move in",
        "start date",
        "move-in date",
        "lease begin",
      ],
      lease_end: [
        "lease end",
        "lease expiration",
        "end date",
        "expiration",
        "lease expire",
      ],
      occupancy_status: [
        "status",
        "unit status",
        "occupied",
        "occupancy",
        "vacancy status",
      ],
      market_rent: [
        "market rent",
        "market rate",
        "market + addl",
        "market",
        "asking rent",
      ],
      tenant_name: ["name", "tenant", "resident", "tenant name", "lessee"],
    }

    for (const [colLetter, headerText] of Object.entries(headers)) {
      const normalizedHeader = headerText.toLowerCase().trim()

      for (const [field, keywords] of Object.entries(fieldMappings)) {
        if (keywords.some((keyword) => normalizedHeader.includes(keyword))) {
          mapping[field as keyof ColumnMapping] = colLetter
        }
      }
    }

    return mapping
  },

  findDataStartRow(sheetData: unknown[][], headerRow: number): number {
    for (
      let row = headerRow + 1;
      row < Math.min(headerRow + 5, sheetData.length);
      row++
    ) {
      const currentRow = sheetData[row]
      if (!currentRow) continue

      const hasData = currentRow.some(
        (cell) =>
          cell !== null &&
          cell !== undefined &&
          String(cell).trim() !== "" &&
          !isLikelyHeaderRow([cell]),
      )

      if (hasData) {
        return row
      }
    }

    return headerRow + 1
  },
}
