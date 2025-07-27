import type {
  ColumnMapping,
  HeaderDetectionResult,
  RawSheetData,
} from "./types"

export const HeaderDetectorService = {
  detectHeaders(rawSheet: RawSheetData): HeaderDetectionResult {
    const { data } = rawSheet
    console.log(
      `🔍 [HeaderDetector] Starting header detection for sheet: ${rawSheet.name}`,
    )
    console.log(
      `📊 [HeaderDetector] Sheet has ${data.length} rows and ${data[0]?.length || 0} columns`,
    )

    // Common header patterns for rent roll files
    const headerPatterns = {
      unit_number: [
        "unit",
        "unit number",
        "unit #",
        "apt",
        "apartment",
        "suite",
      ],
      tenant_name: [
        "tenant",
        "tenant name",
        "resident",
        "resident name",
        "name",
      ],
      current_rent: [
        "rent",
        "current rent",
        "monthly rent",
        "amount",
        "rental amount",
      ],
      lease_start: [
        "lease start",
        "start date",
        "move in",
        "move-in",
        "lease begin",
      ],
      lease_end: [
        "lease end",
        "end date",
        "move out",
        "move-out",
        "lease expire",
        "expiration",
      ],
      occupancy_status: ["status", "occupancy", "occupied", "vacancy status"],
      square_footage: ["sqft", "sq ft", "square feet", "size", "area"],
      floor_plan: ["floor plan", "floorplan", "type", "plan"],
      market_rent: ["market rent", "market rate", "asking rent", "base rent"],
    }

    let bestMatch: HeaderDetectionResult = {
      headerRow: -1,
      dataStartRow: -1,
      headers: {},
      columnMapping: {},
      confidence: 0,
    }

    // Search for headers in first 10 rows
    for (let rowIndex = 0; rowIndex < Math.min(10, data.length); rowIndex++) {
      const row = data[rowIndex]
      if (!row || row.length === 0) continue

      console.log(
        `🔍 [HeaderDetector] Checking row ${rowIndex + 1}:`,
        row.slice(0, 8),
      ) // Show first 8 columns

      const headers: Record<string, string> = {}
      const columnMapping: Partial<ColumnMapping> = {}
      let matchCount = 0
      const foundMatches: string[] = []

      // Check each cell in the row
      row.forEach((cell, colIndex) => {
        const cellValue = String(cell || "")
          .toLowerCase()
          .trim()
        if (!cellValue) return

        headers[this.columnIndexToLetter(colIndex)] = cellValue

        // Try to match against patterns
        for (const [field, patterns] of Object.entries(headerPatterns)) {
          for (const pattern of patterns) {
            if (cellValue.includes(pattern.toLowerCase())) {
              columnMapping[field as keyof ColumnMapping] =
                this.columnIndexToLetter(colIndex)
              matchCount++
              foundMatches.push(
                `${field}: "${cellValue}" (matched "${pattern}")`,
              )
              break
            }
          }
        }
      })

      // Calculate confidence based on matches
      const confidence =
        matchCount / Math.max(Object.keys(headerPatterns).length, row.length)

      console.log(`📈 [HeaderDetector] Row ${rowIndex + 1} results:`)
      console.log(`   Matches found (${matchCount}):`, foundMatches)
      console.log(`   Confidence: ${Math.round(confidence * 100)}%`)
      console.log(`   Column mapping:`, columnMapping)

      if (confidence > bestMatch.confidence && matchCount >= 2) {
        console.log(
          `✅ [HeaderDetector] New best match found at row ${rowIndex + 1}!`,
        )
        bestMatch = {
          headerRow: rowIndex,
          dataStartRow: rowIndex + 1,
          headers,
          columnMapping,
          confidence,
        }
      }
    }

    console.log(`🎯 [HeaderDetector] Final result:`)
    console.log(`   Best header row: ${bestMatch.headerRow + 1}`)
    console.log(`   Data starts at row: ${bestMatch.dataStartRow + 1}`)
    console.log(
      `   Final confidence: ${Math.round(bestMatch.confidence * 100)}%`,
    )
    console.log(`   Final column mapping:`, bestMatch.columnMapping)
    console.log(
      `   Available headers:`,
      Object.values(bestMatch.headers).slice(0, 10),
    )

    return bestMatch
  },

  columnIndexToLetter(index: number): string {
    let result = ""
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result
      index = Math.floor(index / 26) - 1
    }
    return result
  },

  columnLetterToIndex(letter: string): number {
    let result = 0
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64)
    }
    return result - 1
  },
}
