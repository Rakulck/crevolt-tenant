import type {
  ClientExtractionResult,
  RawSheetData,
  RentRollUnit,
} from "@/lib/types/underwriting/rent-roll";
import {
  hasMinimumData,
  inferOccupancyStatus,
  isEmptyRow,
  validateUnit,
} from "../utils/validation.utils";

export const ClientDataExtractor = {
  extractSheetData(
    rawSheet: RawSheetData,
    columnMapping: Record<string, string>,
    options: {
      startRow?: number;
      endRow?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {},
  ): ClientExtractionResult {
    const errors: string[] = [];

    // Validate inputs
    if (Object.values(columnMapping).every((col) => !col)) {
      errors.push("No column mappings found - cannot extract data");
      return ClientDataExtractor.createEmptyResult(rawSheet.index, errors);
    }

    const extractedUnits: RentRollUnit[] = [];
    const { startRow = 0, endRow = rawSheet.data.length } = options;

    // Process each row
    for (let i = startRow; i < Math.min(endRow, rawSheet.data.length); i++) {
      const row = rawSheet.data[i];

      // Skip summary/total rows
      if (ClientDataExtractor.isSummaryRow(row)) {
        continue;
      }

      try {
        const rawData = ClientDataExtractor.extractRowData(row, columnMapping);

        if (!rawData.unit_number) {
          continue; // Skip rows without unit numbers
        }

        // Transform raw data into ExtractedUnit
        const unit: RentRollUnit = {
          unit_number: rawData.unit_number,
          tenant_name: rawData.tenant_name,
          current_rent: rawData.current_rent,
          square_footage: rawData.square_footage,
          occupancy_status: rawData.occupancy_status,
        };

        extractedUnits.push(unit);

        // Report progress
        if (options.onProgress) {
          options.onProgress(i - startRow + 1, endRow - startRow);
        }
      } catch (error) {
        errors.push(`Error processing row ${i + 1}: ${error instanceof Error ? error.message : "Unknown extraction error"}`);
      }
    }

    const summary = ClientDataExtractor.calculateSummary(extractedUnits);

    return {
      sheetIndex: rawSheet.index,
      data: extractedUnits,
      summary,
      errors,
    };
  },

  extractAllSheets(
    rawSheets: RawSheetData[],
    onSheetProgress?: (sheetIndex: number, processed: number, total: number) => void,
    onOverallProgress?: (sheetsCompleted: number, totalSheets: number) => void,
  ): ClientExtractionResult[] {
    const results: ClientExtractionResult[] = [];

    for (let i = 0; i < rawSheets.length; i++) {
      const sheet = rawSheets[i];

      if (!sheet) {
        continue;
      }

      const result = this.extractSheetData(sheet, {
        onProgress: onSheetProgress
          ? (processed, total) => onSheetProgress(i, processed, total)
          : undefined,
      });

      results.push(result);

      if (onOverallProgress) {
        onOverallProgress(i + 1, rawSheets.length);
      }
    }

    return results;
  },

  extractDataChunk(
    rawSheet: RawSheetData,
    startRow: number,
    chunkSize = 100,
  ): ClientExtractionResult {
    return this.extractSheetData(rawSheet, {
      startRow,
      endRow: startRow + chunkSize,
    });
  },

  isSummaryRow(row: unknown[]): boolean {
    const rowText = row.map((cell) => String(cell || "").toLowerCase()).join(" ");

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
    ];

    return summaryKeywords.some((keyword) => rowText.includes(keyword));
  },

  extractRowData(
    row: unknown[],
    columnMapping: Record<string, string>,
  ): Record<string, unknown> {
    const rawData: Record<string, unknown> = {};

    for (const [field, columnLetter] of Object.entries(columnMapping)) {
      if (columnLetter) {
        const colIndex = ClientDataExtractor.columnLetterToIndex(columnLetter);
        if (colIndex < row.length) {
          rawData[field] = row[colIndex];
        }
      }
    }

    return rawData;
  },

  columnLetterToIndex(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result - 1;
  },

  calculateSummary(units: RentRollUnit[]): {
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    total_rent: number;
    average_rent: number;
    average_sqft: number;
    occupancy_rate: number;
  } {
    if (units.length === 0) {
      return {
        total_units: 0,
        occupied_units: 0,
        vacant_units: 0,
        total_rent: 0,
        average_rent: 0,
        average_sqft: 0,
        occupancy_rate: 0,
      };
    }

    const occupiedUnits = units.filter((unit) =>
      unit.occupancy_status.toLowerCase().includes("occupied"),
    );

    const totalRent = units.reduce((sum, unit) => {
      const rent = unit.current_rent || 0;
      return sum + rent;
    }, 0);

    const unitsWithSqft = units.filter((unit) => unit.square_footage && unit.square_footage > 0);
    const totalSqft = unitsWithSqft.reduce((sum, unit) => sum + (unit.square_footage || 0), 0);

    const unitsWithRent = units.filter((unit) => unit.current_rent && unit.current_rent > 0);
    const averageRent = unitsWithRent.length > 0 ? totalRent / unitsWithRent.length : 0;

    return {
      total_units: units.length,
      occupied_units: occupiedUnits.length,
      vacant_units: units.length - occupiedUnits.length,
      total_rent: totalRent,
      average_rent: Math.round(averageRent * 100) / 100,
      average_sqft:
        unitsWithSqft.length > 0 ? Math.round((totalSqft / unitsWithSqft.length) * 100) / 100 : 0,
      occupancy_rate: Math.round((occupiedUnits.length / units.length) * 10000) / 100,
    };
  },

  createEmptyResult(sheetIndex: number, errors: string[]): ClientExtractionResult {
    return {
      sheetIndex,
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
    };
  }
};
