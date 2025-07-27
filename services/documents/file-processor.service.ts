import * as XLSX from "xlsx"

import type { FileProcessorResult } from "../rent-roll/types"

/**
 * Shared file processing service for Excel and CSV files
 * Used across different underwriting document types
 */
export const FileProcessorService = {
  async processFile(file: File): Promise<FileProcessorResult> {
    const fileType = FileProcessorService.detectFileType(file)
    const buffer = Buffer.from(await file.arrayBuffer())

    switch (fileType) {
      case "excel":
        return FileProcessorService.processExcelFile(buffer)
      case "csv":
        return FileProcessorService.processCsvFile(buffer, file.name)
      default:
        throw new Error(`Unsupported file type: ${file.type}`)
    }
  },

  async processSpreadsheet(file: File): Promise<{
    headers: string[]
    rows: string[][]
    metadata?: {
      totalRows: number
      hasHeaders: boolean
    }
  }> {
    const result = await FileProcessorService.processFile(file)

    if (result.sheets.length === 0 || !result.sheets[0]?.data) {
      return {
        headers: [],
        rows: [],
        metadata: {
          totalRows: 0,
          hasHeaders: false,
        },
      }
    }

    const sheet = result.sheets[0]
    const { data } = sheet

    // Check if first row looks like headers
    const firstRow = data[0] || []
    const hasHeaders =
      firstRow.length > 0 &&
      firstRow.every(
        (cell) =>
          typeof cell === "string" &&
          cell.length > 0 &&
          !Number.isFinite(Number(cell)),
      )

    const headers = hasHeaders
      ? firstRow.map((cell) => String(cell || ""))
      : firstRow.map((_, index) => `Column ${index + 1}`)

    const rows = (hasHeaders ? data.slice(1) : data).map((row) =>
      row.map((cell) => String(cell || "")),
    )

    return {
      headers,
      rows,
      metadata: {
        totalRows: rows.length,
        hasHeaders,
      },
    }
  },

  detectFileType(file: File): string {
    const extension = file.name.toLowerCase().split(".").pop()

    switch (extension) {
      case "xlsx":
      case "xls":
        return "excel"
      case "csv":
        return "csv"
      default:
        if (file.type.includes("spreadsheet") || file.type.includes("excel")) {
          return "excel"
        }
        if (file.type.includes("csv")) {
          return "csv"
        }
        throw new Error(
          `Unsupported file type: ${file.type}. Only Excel (.xlsx, .xls) and CSV files are supported.`,
        )
    }
  },

  processExcelFile(buffer: Buffer): FileProcessorResult {
    try {
      const workbook = XLSX.read(buffer, {
        type: "buffer",
        cellDates: true,
        cellStyles: true,
        cellFormula: false,
      })

      const sheets = workbook.SheetNames.map((name, index) => {
        const worksheet = workbook.Sheets[name]
        if (!worksheet) {
          throw new Error(`Worksheet ${name} not found in Excel file`)
        }
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          blankrows: true,
        }) as unknown[][]

        return {
          name,
          data,
          index,
        }
      })

      return {
        type: "excel",
        sheets,
      }
    } catch (error) {
      throw new Error(
        `Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  },

  processCsvFile(buffer: Buffer, fileName: string): FileProcessorResult {
    try {
      const text = FileProcessorService.detectAndDecodeText(buffer)
      const delimiter = FileProcessorService.detectDelimiter(text)
      const lines = text.split(/\r?\n/)

      const data: unknown[][] = lines
        .filter((line) => line.trim())
        .map((line) => FileProcessorService.parseCsvLine(line, delimiter))

      return {
        type: "csv",
        sheets: [
          {
            name: fileName.replace(/\.[^/.]+$/, ""),
            data,
            index: 0,
          },
        ],
      }
    } catch (error) {
      throw new Error(
        `Failed to process CSV file: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  },

  detectAndDecodeText(buffer: Buffer): string {
    const encodings = ["utf-8", "utf-16le", "ascii", "latin1"]

    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding as BufferEncoding)
        if (FileProcessorService.isValidText(text)) {
          return text
        }
      } catch {
        // Skip this file if there's an error
      }
    }

    throw new Error("Could not detect text encoding")
  },

  isValidText(text: string): boolean {
    const nonPrintableChars = text.match(/[^\x20-\x7E]/g)
    return !nonPrintableChars || nonPrintableChars.length < text.length * 0.1
  },

  detectDelimiter(text: string): string {
    const delimiters = [",", ";", "\t", "|"]
    const sampleLines = text.split(/\r?\n/).slice(0, 5)

    let bestDelimiter = ","
    let maxConsistency = 0

    for (const delimiter of delimiters) {
      const counts = sampleLines.map(
        (line) => (line.match(new RegExp(`\\${delimiter}`, "g")) || []).length,
      )

      if (counts.length > 0) {
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length
        const consistency =
          avg > 0 ? 1 - (Math.max(...counts) - Math.min(...counts)) / avg : 0

        if (consistency > maxConsistency && avg > 0) {
          maxConsistency = consistency
          bestDelimiter = delimiter
        }
      }
    }

    return bestDelimiter
  },

  parseCsvLine(line: string, delimiter: string): unknown[] {
    const result: unknown[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(FileProcessorService.parseValue(current.trim()))
        current = ""
        i++
        continue
      } else {
        current += char
      }
      i++
    }

    result.push(FileProcessorService.parseValue(current.trim()))
    return result
  },

  parseValue(value: string): unknown {
    if (value === "" || value === '""') return null

    const unquotedValue =
      value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value

    if (unquotedValue === "") return null

    const numValue = Number(unquotedValue.replace(/[$,]/g, ""))
    if (!Number.isNaN(numValue) && unquotedValue.match(/^[\d.,\-$\s]+$/)) {
      return numValue
    }

    const dateValue = Date.parse(unquotedValue)
    if (
      !Number.isNaN(dateValue) &&
      unquotedValue.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
    ) {
      return new Date(dateValue)
    }

    return unquotedValue
  },
}
