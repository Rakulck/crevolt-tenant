import type {
  FileMetadata,
  MetadataResponse,
  ProcessingMetadata,
  RawFileData,
  RawSheetData,
  SheetMetadata,
} from "@/lib/types/metadata"
import { aiCacheService } from "../../../../../services/documents/ai-cache.service"
import { FileProcessorService } from "../../../../../services/documents/file-processor.service"
import { classifySheet } from "../utils/ai-analysis.utils"
import { HeaderDetectorService } from "./header-detector.service"

/**
 * Service for processing file metadata and sheet classification
 * Coordinates sheet analysis and metadata generation
 */
export const MetadataProcessorService = {
  async processFileForMetadata(file: File): Promise<MetadataResponse> {
    const startTime = Date.now()

    try {
      // Process file to get raw structure
      const fileProcessorResult = await FileProcessorService.processFile(file)

      // Process sheets to get metadata
      const sheetMetadata: SheetMetadata[] = []
      const rawSheets: RawSheetData[] = []
      const errors: string[] = []

      for (const sheet of fileProcessorResult.sheets) {
        try {
          // Classify sheet type
          const firstRows = sheet.data.slice(0, 20)
          const classification = await classifySheet(sheet.name, firstRows)

          // Skip summary sheets
          if (classification.type === "summary") {
            continue
          }

          // Generate cache key for this sheet
          const firstRowsHash = aiCacheService.hashFirstRows(sheet.data)
          const sheetCacheKey = aiCacheService.generateKey({
            name: `${file.name}_${sheet.name}`,
            size: sheet.data.length,
            firstRowsHash,
          })

          // Detect headers using AI (with caching)
          const headerDetection = await HeaderDetectorService.detectHeaders(
            sheet.data,
            sheetCacheKey,
          )

          // Create metadata
          const metadata: SheetMetadata = {
            name: sheet.name,
            index: sheet.index,
            type: classification.type,
            propertyName: classification.propertyName || undefined,
            headerDetection,
            rowCount: sheet.data.length,
            sampleData: sheet.data.slice(
              headerDetection.headerRow,
              headerDetection.headerRow + 5,
            ),
          }

          // Create raw data structure
          const rawSheet: RawSheetData = {
            name: sheet.name,
            index: sheet.index,
            rows: sheet.data,
            headerRow: headerDetection.headerRow,
            dataStartRow: headerDetection.dataStartRow,
            columnMapping: headerDetection.columnMapping,
          }

          sheetMetadata.push(metadata)
          rawSheets.push(rawSheet)
        } catch (error) {
          const errorMsg = `Sheet ${sheet.name}: ${error instanceof Error ? error.message : "Processing failed"}`
          errors.push(errorMsg)
          console.error("Sheet processing error:", error)
        }
      }

      if (sheetMetadata.length === 0) {
        throw new Error("No valid rent-roll sheets found in the file")
      }

      // Create file metadata
      const fileMetadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: fileProcessorResult.type,
        sheets: sheetMetadata,
      }

      // Create processing metadata
      const processingMetadata: ProcessingMetadata = {
        success: true,
        processingTimeMs: Date.now() - startTime,
        fileInfo: fileMetadata,
        errors,
        aiCacheKey: MetadataProcessorService.generateCacheKey(
          file,
          sheetMetadata,
        ),
      }

      // Create raw data
      const rawData: RawFileData = {
        type: fileProcessorResult.type,
        sheets: rawSheets,
      }

      return {
        metadata: processingMetadata,
        rawData,
      }
    } catch (error) {
      console.error("Metadata processing error:", error)

      const errorMetadata: ProcessingMetadata = {
        success: false,
        processingTimeMs: Date.now() - startTime,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: "excel",
          sheets: [],
        },
        errors: [
          error instanceof Error ? error.message : "Unknown processing error",
        ],
      }

      return {
        metadata: errorMetadata,
        rawData: { type: "excel", sheets: [] },
      }
    }
  },

  generateCacheKey(file: File, sheetMetadata: SheetMetadata[]): string {
    // Generate a cache key based on file characteristics
    const fileHash = `${file.name}_${file.size}_${file.lastModified || Date.now()}`
    const sheetsHash = sheetMetadata
      .map((s) => `${s.name}_${s.rowCount}`)
      .join("_")
    return `${fileHash}_${sheetsHash}`.replace(/[^a-zA-Z0-9_]/g, "_")
  },

  compressRawData(rawData: RawFileData): string {
    // Compress raw data for efficient transmission
    try {
      return JSON.stringify(rawData)
    } catch (error) {
      console.error("Failed to compress raw data:", error)
      return JSON.stringify({ type: rawData.type, sheets: [] })
    }
  },

  decompressRawData(compressedData: string): RawFileData {
    // Decompress raw data on client side
    try {
      return JSON.parse(compressedData)
    } catch (error) {
      console.error("Failed to decompress raw data:", error)
      return { type: "excel", sheets: [] }
    }
  },
}
