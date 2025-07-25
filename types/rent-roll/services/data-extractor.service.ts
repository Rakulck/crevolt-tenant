import type { RentRollSummary, RentRollUnit } from "../types"

export interface ExtractionResult {
  data: RentRollUnit[]
  summary: RentRollSummary
  errors: string[]
}

export const DataExtractorService = {
  extractData(
    rawSheet: RawSheetData,
    columnMapping: Record<string, string>,
    options: {
      startRow?: number
      endRow?: number
      onProgress?: (processed: number, total: number) => void
    } = {},
  ): ExtractionResult {
    const errors: string[] = []

    if (Object.values(columnMapping).every((col) => !col)) {
      errors.push("No column mappings found - cannot extract data")
      return DataExtractorService.createEmptyResult(errors)
    }

    const extractedUnits: RentRollUnit[] = []
    const { startRow = 0, endRow = rawSheet.data.length } = options

    // Process each row
    for (let i = startRow; i < Math.min(endRow, rawSheet.data.length); i++) {
      const row = rawSheet.data[i]

      // Skip summary/total rows
      if (DataExtractorService.isSummaryRow(row)) {
        continue
      }

      try {
        const rawData = DataExtractorService.extractRowData(row, columnMapping)

        if (!rawData.unit_number) {
          continue
        }

        // Transform raw data into ExtractedUnit
        const unit: RentRollUnit = {
          unit_number: rawData.unit_number,
          tenant_name: rawData.tenant_name,
          current_rent: rawData.current_rent,
          square_footage: rawData.square_footage,
          occupancy_status: rawData.occupancy_status,
        }

        extractedUnits.push(unit)

        // Report progress
        if (options.onProgress) {
          options.onProgress(i - startRow + 1, endRow - startRow)
        }
      } catch (error) {
        errors.push(`Error processing row ${i + 1}: ${error}`)
      }
    }

    const summary = DataExtractorService.calculateSummary(extractedUnits)

    return {
      sheetIndex: rawSheet.index,
      units: extractedUnits,
      summary,
      errors,
    }
  },

  extractRowData(
    row: unknown[],
    columnMapping: Record<string, string>,
  ): RawUnitData {
    const rawData: RawUnitData = {}

    for (const [field, columnLetter] of Object.entries(columnMapping)) {
      if (columnLetter) {
        const colIndex = DataExtractorService.columnLetterToIndex(columnLetter)
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
      "overall",
      "average",
      "mean",
      "median",
    ]

    return summaryKeywords.some((keyword) => rowText.includes(keyword))
  },

  calculateSummary(units: RentRollUnit[]): SheetSummary {
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
    const totalRent = occupiedUnits.reduce(
      (sum, unit) => sum + (unit.current_rent || 0),
      0,
    )
    const totalSqft = units.reduce(
      (sum, unit) => sum + (unit.square_footage || 0),
      0,
    )

    return {
      total_units: units.length,
      occupied_units: occupiedUnits.length,
      vacant_units: units.length - occupiedUnits.length,
      total_rent: totalRent,
      average_rent: Math.round(totalRent / occupiedUnits.length),
      average_sqft: Math.round(totalSqft / units.length),
      occupancy_rate:
        Math.round((occupiedUnits.length / units.length) * 10000) / 100,
    }
  },

  createEmptyResult(errors: string[]): ClientExtractionResult {
    return {
      sheetIndex: -1,
      units: [],
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
