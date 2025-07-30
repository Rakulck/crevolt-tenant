import { FileProcessorService } from "../../../../../services/documents/file-processor.service"
import type { ProcessedSheet, ProcessingOptions } from "../types"
import { SheetProcessorService } from "./sheet-processor.service"

export interface RentRollProcessingResult {
  success: boolean
  sheets: ProcessedSheet[]
  errors: string[]
  processingTimeMs: number
}

export const RentRollProcessorService = {
  async processFile(file: File): Promise<ProcessedRentRoll> {
    try {
      // Process file to get raw structure
      const fileProcessorResult = await FileProcessorService.processFile(file)

      // Process sheets to extract rent roll data
      const processedSheets = await SheetProcessorService.processSheets(
        fileProcessorResult.sheets,
        options,
      )

      const errors = processedSheets.flatMap((sheet) => sheet.errors || [])

      return {
        success: processedSheets.length > 0,
        sheets: processedSheets,
        errors,
        processingTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      console.error("Rent roll processing error:", error)

      return {
        success: false,
        sheets: [],
        errors: [
          error instanceof Error ? error.message : "Unknown processing error",
        ],
        processingTimeMs: Date.now() - startTime,
      }
    }
  },
}
