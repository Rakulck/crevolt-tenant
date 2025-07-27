import { generateTenantId } from "../../utils/tenant-utils"
import { FileProcessorService } from "../documents/file-processor.service"

import { DataExtractorService } from "./data-extractor.service"
import { HeaderDetectorService } from "./header-detector.service"

import type {
  ExtractedTenantData,
  ProcessedSheet,
  RentRollProcessingResult,
} from "./types"

interface ProcessingOptions {
  onProgress?: (
    processed: number,
    total: number,
    stage: "headers" | "data" | "conversion",
  ) => void
}

export const RentRollProcessorService = {
  async processFile(
    file: File,
    options: ProcessingOptions = {},
  ): Promise<RentRollProcessingResult> {
    const startTime = Date.now()

    try {
      console.log(`🔄 [RentRollProcessor] Processing sheet: ${file.name}`)

      // Step 1: Process file to get raw structure
      const fileProcessorResult = await FileProcessorService.processFile(file)
      console.log(
        `📄 [RentRollProcessor] Sheet dimensions: ${fileProcessorResult.sheets.length} sheets`,
      )

      // Step 2: Process each sheet
      const processedSheets: ProcessedSheet[] = []
      const allErrors: string[] = []
      let totalRows = 0
      let processedRows = 0

      // Calculate total rows for progress
      fileProcessorResult.sheets.forEach((sheet) => {
        totalRows += sheet.data.length
      })

      for (const rawSheet of fileProcessorResult.sheets) {
        try {
          // Update progress for header detection
          options.onProgress?.(0, totalRows, "headers")

          // Detect headers and column mapping
          const headerDetection = HeaderDetectorService.detectHeaders(rawSheet)

          console.log(
            `🎯 [RentRollProcessor] Header detection confidence: ${Math.round(
              headerDetection.confidence * 100,
            )}%`,
          )

          if (headerDetection.confidence < 0.3) {
            const errorMsg = `Sheet "${rawSheet.name}": Low confidence in header detection (${Math.round(
              headerDetection.confidence * 100,
            )}%)`
            console.log(`❌ [RentRollProcessor] ${errorMsg}`)
            allErrors.push(errorMsg)
            continue
          }

          // Extract data using detected headers
          const extractionResult = await DataExtractorService.extractData(
            rawSheet,
            headerDetection,
            {
              onProgress: (processed, total) => {
                const sheetProgress = processedRows + processed
                options.onProgress?.(sheetProgress, totalRows, "data")
              },
            },
          )

          processedRows += rawSheet.data.length

          const processedSheet: ProcessedSheet = {
            sheetInfo: {
              name: rawSheet.name,
              index: rawSheet.index,
              type: extractionResult.data.length > 0 ? "rent_roll" : "unknown",
              propertyName: this.extractPropertyName(rawSheet.name),
            },
            headerDetection,
            data: extractionResult.data,
            summary: extractionResult.summary,
            errors: extractionResult.errors,
          }

          processedSheets.push(processedSheet)
          allErrors.push(...extractionResult.errors)

          console.log(
            `✅ [RentRollProcessor] Sheet "${rawSheet.name}" processed: ${extractionResult.data.length} units extracted`,
          )
          if (extractionResult.errors.length > 0) {
            console.log(
              `⚠️ [RentRollProcessor] Extraction errors:`,
              extractionResult.errors,
            )
          }
        } catch (error) {
          const errorMessage = `Error processing sheet "${rawSheet.name}": ${error instanceof Error ? error.message : "Unknown error"}`
          allErrors.push(errorMessage)
          console.error(errorMessage)
        }
      }

      // Step 3: Convert rent roll units to tenant data
      console.log(`🔄 [RentRollProcessor] Converting units to tenant data...`)
      options.onProgress?.(totalRows, totalRows, "conversion")
      const extractedTenants = this.convertToTenantData(processedSheets)

      const result: RentRollProcessingResult = {
        success: processedSheets.length > 0 && extractedTenants.length > 0,
        sheets: processedSheets,
        errors: allErrors,
        processingTimeMs: Date.now() - startTime,
        extractedTenants,
      }

      console.log("🎉 [RentRollProcessor] Processing completed:", {
        success: result.success,
        sheetsProcessed: processedSheets.length,
        totalUnitsFound: processedSheets.reduce(
          (sum, sheet) => sum + sheet.data.length,
          0,
        ),
        tenantsExtracted: extractedTenants.length,
        errors: allErrors.length,
        timeMs: result.processingTimeMs,
      })

      if (allErrors.length > 0) {
        console.log("⚠️ [RentRollProcessor] All errors encountered:", allErrors)
      }

      return result
    } catch (error) {
      console.error("💥 [RentRollProcessor] Processing error:", error)

      return {
        success: false,
        sheets: [],
        errors: [
          error instanceof Error ? error.message : "Unknown processing error",
        ],
        processingTimeMs: Date.now() - startTime,
        extractedTenants: [],
      }
    }
  },

  convertToTenantData(
    processedSheets: ProcessedSheet[],
  ): ExtractedTenantData[] {
    const extractedTenants: ExtractedTenantData[] = []

    for (const sheet of processedSheets) {
      for (const unit of sheet.data) {
        // Only convert occupied units with tenant names
        if (
          unit.occupancy_status === "occupied" &&
          unit.tenant_name &&
          unit.tenant_name.trim()
        ) {
          const tenantData: ExtractedTenantData = {
            id: generateTenantId(),
            tenantName: unit.tenant_name.trim(),
            unitNumber: unit.unit_number,
            currentRent: unit.current_rent,
            leaseStartDate: unit.lease_start
              ? this.formatDate(unit.lease_start)
              : "",
            leaseEndDate: unit.lease_end ? this.formatDate(unit.lease_end) : "",
            occupancyStatus: unit.occupancy_status,
            squareFootage: unit.square_footage,
            source: "rent_roll",
          }

          extractedTenants.push(tenantData)
        }
      }
    }

    return extractedTenants
  },

  formatDate(date: Date): string {
    return date.toISOString().split("T")[0] // YYYY-MM-DD format
  },

  extractPropertyName(sheetName: string): string | undefined {
    // Try to extract property name from sheet name
    const cleaned = sheetName
      .replace(/rent\s*roll|sheet\d*|tab\d*/gi, "")
      .trim()
    return cleaned || undefined
  },
}
