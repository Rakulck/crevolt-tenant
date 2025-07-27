import type { ProcessedSheet, ProcessingOptions, SheetInfo } from "../types";
import { classifySheet } from "../utils/ai-analysis.utils";
import { DataExtractorService } from "./data-extractor.service";
import { HeaderDetectorService } from "./header-detector.service";

export const SheetProcessorService = {
  async processSheets(
    sheetsToProcess: Sheet[],
    skipSummarySheets = true,
    requireMinimumUnits = 0
  ) {
    const processedSheets: ProcessedSheet[] = [];
    const errors: string[] = [];

    for (const sheet of sheetsToProcess) {
      try {
        const sheetInfo = await this.analyzeSheet(sheet);

        if (skipSummarySheets && sheetInfo.type === "summary") {
          continue;
        }

        const processedSheet = await this.processSheet(sheet, sheetInfo);

        if (processedSheet.data.length < requireMinimumUnits) {
          continue;
        }

        processedSheets.push(processedSheet);
      } catch (error) {
        errors.push(`Failed to process sheet ${sheet.name}: ${error}`);
      }
    }

    return {
      sheets: processedSheets,
      errors
    };
  },

  async analyzeSheet(sheet: {
    name: string;
    data: unknown[][];
    index: number;
  }): Promise<SheetInfo> {
    const firstRows = sheet.data.slice(0, 20);

    try {
      const classification = await classifySheet(sheet.name, firstRows);

      return {
        name: sheet.name,
        index: sheet.index,
        type: classification.type,
        propertyName: classification.propertyName || undefined,
      };
    } catch (error) {
      console.warn(`Failed to classify sheet ${sheet.name}, using fallback:`, error);
      return this.fallbackSheetClassification(sheet);
    }
  },

  fallbackSheetClassification(sheet: Sheet): SheetInfo {
    try {
      const sheetName = sheet.name.toLowerCase();

      const summaryKeywords = ["summary", "total", "overview", "report", "analysis"];
      const isSummary = summaryKeywords.some((keyword) => sheetName.includes(keyword));

      if (isSummary) {
        return {
          name: sheet.name,
          index: sheet.index,
          type: "summary",
        };
      }

      const hasRentRollData = this.hasRentRollIndicators(sheet.data);

      if (hasRentRollData) {
        const propertyName = this.extractPropertyName(sheet.name);
        return {
          name: sheet.name,
          index: sheet.index,
          type: "rent_roll",
          propertyName,
        };
      }

      return {
        name: sheet.name,
        index: sheet.index,
        type: "unknown",
      };
    } catch (error) {
      console.error("Error in fallbackSheetClassification:", error);
      return {
        name: sheet.name,
        index: sheet.index,
        type: "unknown",
      };
    }
  },

  hasRentRollIndicators(data: unknown[][]): boolean {
    const sampleText = data
      .slice(0, 10)
      .flat()
      .map((cell) => String(cell || "").toLowerCase())
      .join(" ");

    const indicators = [
      "unit",
      "apartment",
      "suite",
      "rent",
      "tenant",
      "lease",
      "occupied",
      "vacant",
      "sqft",
      "floor plan",
    ];

    const foundIndicators = indicators.filter((indicator) => sampleText.includes(indicator));

    return foundIndicators.length >= 3;
  },

  extractPropertyName(sheetName: string): string | undefined {
    const cleanName = sheetName.replace(/[_\-]/g, " ").trim();

    const commonPrefixes = ["sheet", "tab", "page", "rent roll", "rentroll"];
    let propertyName = cleanName;

    for (const prefix of commonPrefixes) {
      const regex = new RegExp(`^${prefix}\\s*\\d*\\s*`, "i");
      propertyName = propertyName.replace(regex, "").trim();
    }

    propertyName = propertyName.replace(/^\d+\s*/, "").trim();

    return propertyName.length > 0 && propertyName !== cleanName ? propertyName : undefined;
  },

  async processSheet(
    sheet: { name: string; data: unknown[][]; index: number },
    sheetInfo: SheetInfo,
  ): Promise<ProcessedSheet> {
    const headerDetection = await HeaderDetectorService.detectHeaders(sheet.data);
    const extractionResult = DataExtractorService.extractData(sheet.data, headerDetection);

    return {
      sheetInfo,
      headerDetection,
      data: extractionResult.data,
      summary: extractionResult.summary,
      errors: extractionResult.errors,
    };
  }
};
