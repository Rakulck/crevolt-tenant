import type {
  ColumnMapping,
  HeaderDetectionResult,
  RawSheetData,
  RentRollSummary,
  RentRollUnit,
} from "./types"

export interface ExtractionResult {
  data: RentRollUnit[]
  summary: RentRollSummary
  errors: string[]
}

export const DataExtractorService = {
  extractData(
    rawSheet: RawSheetData,
    headerDetection: HeaderDetectionResult,
    options: {
      onProgress?: (processed: number, total: number) => void
    } = {},
  ): ExtractionResult {
    const errors: string[] = []
    const { columnMapping, dataStartRow } = headerDetection

    console.log(
      `🔧 [DataExtractor] Starting data extraction for sheet: ${rawSheet.name}`,
    )
    console.log(`📋 [DataExtractor] Column mapping:`, columnMapping)
    console.log(`📍 [DataExtractor] Data starts at row: ${dataStartRow + 1}`)

    if (Object.keys(columnMapping).length === 0) {
      console.log(`❌ [DataExtractor] No column mappings found`)
      errors.push("No column mappings found - cannot extract data")
      return this.createEmptyResult(errors)
    }

    const extractedUnits: RentRollUnit[] = []
    const { data } = rawSheet
    console.log(
      `📊 [DataExtractor] Processing ${data.length - dataStartRow} rows of data`,
    )

    // Process each row starting from data start row
    let processedCount = 0
    let skippedCount = 0
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) {
        skippedCount++
        continue
      }

      // Skip summary/total rows
      if (this.isSummaryRow(row)) {
        console.log(
          `⏭️ [DataExtractor] Skipping summary row ${i + 1}:`,
          row.slice(0, 5),
        )
        skippedCount++
        continue
      }

      try {
        const rawData = this.extractRowData(row, columnMapping)

        if (!rawData.unit_number) {
          console.log(
            `⏭️ [DataExtractor] Skipping row ${i + 1} - no unit number`,
          )
          skippedCount++
          continue // Skip rows without unit numbers
        }

        // Transform raw data into RentRollUnit
        const unit: RentRollUnit = {
          unit_number: String(rawData.unit_number || ""),
          tenant_name: String(rawData.tenant_name || ""),
          current_rent: this.parseNumber(rawData.current_rent),
          square_footage: this.parseNumber(rawData.square_footage),
          occupancy_status: this.inferOccupancyStatus(
            rawData.occupancy_status,
            rawData.tenant_name,
          ),
          lease_start: this.parseDate(rawData.lease_start),
          lease_end: this.parseDate(rawData.lease_end),
          floor_plan: String(rawData.floor_plan || ""),
          market_rent: this.parseNumber(rawData.market_rent),
        }

        // Log the extracted unit for first few rows
        if (processedCount < 3) {
          console.log(`✅ [DataExtractor] Row ${i + 1} extracted:`, {
            unit_number: unit.unit_number,
            tenant_name: unit.tenant_name,
            current_rent: unit.current_rent,
            occupancy_status: unit.occupancy_status,
          })
        }

        // Validate unit has minimum required data
        if (this.validateUnit(unit)) {
          extractedUnits.push(unit)
          processedCount++
        } else {
          console.log(
            `❌ [DataExtractor] Row ${i + 1} validation failed:`,
            unit,
          )
          errors.push(
            `Row ${i + 1}: Unit ${unit.unit_number} missing required data`,
          )
        }

        // Report progress
        if (options.onProgress) {
          options.onProgress(i - dataStartRow + 1, data.length - dataStartRow)
        }
      } catch (error) {
        console.log(`💥 [DataExtractor] Error on row ${i + 1}:`, error)
        errors.push(
          `Error processing row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }

    console.log(`📈 [DataExtractor] Extraction complete:`)
    console.log(`   ✅ Successfully extracted: ${extractedUnits.length} units`)
    console.log(`   ⏭️ Skipped rows: ${skippedCount}`)
    console.log(`   ❌ Errors: ${errors.length}`)

    const summary = this.calculateSummary(extractedUnits)

    return {
      data: extractedUnits,
      summary,
      errors,
    }
  },

  extractRowData(
    row: unknown[],
    columnMapping: Partial<ColumnMapping>,
  ): Record<string, unknown> {
    const rawData: Record<string, unknown> = {}

    for (const [field, columnLetter] of Object.entries(columnMapping)) {
      if (columnLetter) {
        const colIndex = this.columnLetterToIndex(columnLetter)
        if (colIndex < row.length) {
          rawData[field] = row[colIndex]
        }
      }
    }

    return rawData
  },

  columnLetterToIndex(letter: string): number {
    let result = 0
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64)
    }
    return result - 1
  },

  isSummaryRow(row: unknown[]): boolean {
    const rowText = row
      .map((cell) => String(cell || "").toLowerCase())
      .join(" ")

    const summaryKeywords = [
      "total",
      "summary",
      "subtotal",
      "grand total",
      "sum",
      "average",
      "occupied units",
      "vacant units",
      "revenue",
      "non rev",
      "totals",
      "current/notice/vacant",
      "future residents",
      "applicants",
      "groups",
    ]

    return summaryKeywords.some((keyword) => rowText.includes(keyword))
  },

  parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null

    const stringValue = String(value).replace(/[$,\s]/g, "")
    const parsed = Number(stringValue)

    return isNaN(parsed) ? null : parsed
  },

  parseDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === "") return null

    if (value instanceof Date) return value

    const parsed = new Date(String(value))
    return isNaN(parsed.getTime()) ? null : parsed
  },

  inferOccupancyStatus(status: unknown, tenantName: unknown): string {
    const statusStr = String(status || "").toLowerCase()
    const tenantStr = String(tenantName || "").toLowerCase()

    if (
      statusStr.includes("vacant") ||
      statusStr.includes("empty") ||
      !tenantStr ||
      tenantStr === "-"
    ) {
      return "vacant"
    }

    if (
      statusStr.includes("occupied") ||
      statusStr.includes("rented") ||
      tenantStr
    ) {
      return "occupied"
    }

    if (statusStr.includes("notice") || statusStr.includes("moving")) {
      return "notice"
    }

    return tenantStr ? "occupied" : "vacant"
  },

  validateUnit(unit: RentRollUnit): boolean {
    return !!(unit.unit_number && unit.unit_number.trim())
  },

  calculateSummary(units: RentRollUnit[]): RentRollSummary {
    if (units.length === 0) {
      return {
        total_units: 0,
        occupied_units: 0,
        vacant_units: 0,
        total_rent: 0,
        average_rent: 0,
        average_sqft: 0,
        occupancy_rate: 0,
      }
    }

    const occupiedUnits = units.filter(
      (unit) => unit.occupancy_status === "occupied",
    )
    const unitsWithRent = units.filter(
      (unit) => unit.current_rent && unit.current_rent > 0,
    )
    const unitsWithSqft = units.filter(
      (unit) => unit.square_footage && unit.square_footage > 0,
    )

    const totalRent = unitsWithRent.reduce(
      (sum, unit) => sum + (unit.current_rent || 0),
      0,
    )
    const totalSqft = unitsWithSqft.reduce(
      (sum, unit) => sum + (unit.square_footage || 0),
      0,
    )

    return {
      total_units: units.length,
      occupied_units: occupiedUnits.length,
      vacant_units: units.length - occupiedUnits.length,
      total_rent: totalRent,
      average_rent:
        unitsWithRent.length > 0
          ? Math.round(totalRent / unitsWithRent.length)
          : 0,
      average_sqft:
        unitsWithSqft.length > 0
          ? Math.round(totalSqft / unitsWithSqft.length)
          : 0,
      occupancy_rate:
        Math.round((occupiedUnits.length / units.length) * 10000) / 100,
    }
  },

  createEmptyResult(errors: string[]): ExtractionResult {
    return {
      data: [],
      summary: {
        total_units: 0,
        occupied_units: 0,
        vacant_units: 0,
        total_rent: 0,
        average_rent: 0,
        average_sqft: 0,
        occupancy_rate: 0,
      },
      errors,
    }
  },
}
