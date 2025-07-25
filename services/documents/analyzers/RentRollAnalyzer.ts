import type { DocumentAnalysisResult, DocumentFile } from "@/lib/types/documents";
import { BaseDocumentAnalyzer } from "@/lib/types/documents/analyzers/base";
import { FileProcessorService } from "@/services/documents/file-processor.service";
import { Effect } from "effect";
import OpenAI from "openai";

export class RentRollAnalyzer extends BaseDocumentAnalyzer {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  getSupportedDocumentType(): string {
    return "rent_roll";
  }

  analyzeDocument(document: DocumentFile): Effect.Effect<DocumentAnalysisResult, Error> {
    const startTime = Date.now();
    const self = this;
    return Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          self.validateFile(document.file);
        }),
      );
      const analysisResult: {
        summary: string;
        extractedData: Record<string, unknown>;
      } = yield* _(
        Effect.tryPromise({
          try: async () => {
            if (self.isSpreadsheetFile(document.file)) {
              return self.analyzeSpreadsheetRentRoll(document);
            }
            return self.analyzeVisualRentRoll(document);
          },
          catch: (e: unknown) => e as Error,
        }),
      );
      const processingTime = Date.now() - startTime;

      return self.createAnalysisResult(
        document,
        true,
        analysisResult.summary,
        analysisResult.extractedData,
        undefined,
        processingTime,
      );
    }).pipe(
      Effect.catchAll((error: unknown) => {
        const processingTime = Date.now() - startTime;
        return Effect.succeed(
          self.createAnalysisResult(
            document,
            false,
            undefined,
            undefined,
            error instanceof Error ? error.message : "Unknown error",
            processingTime,
          ),
        );
      }),
    );
  }

  private isSpreadsheetFile(file: File): boolean {
    return (
      file.type.includes("spreadsheet") ||
      file.type.includes("excel") ||
      file.type.includes("csv") ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls") ||
      file.name.toLowerCase().endsWith(".csv")
    );
  }

  private async analyzeSpreadsheetRentRoll(document: DocumentFile): Promise<{
    summary: string;
    extractedData: Record<string, unknown>;
  }> {
    try {
      // Use existing file processor to extract data
      const fileResult = await FileProcessorService.processFile(document.file);

      // Find the most relevant sheet (largest one or one with "rent" in name)
      const relevantSheet = fileResult.sheets.reduce((best, current) => {
        if (
          current.name.toLowerCase().includes("rent") ||
          current.name.toLowerCase().includes("roll")
        ) {
          return current;
        }
        return current.data.length > best.data.length ? current : best;
      });

      // Extract numerical insights
      const extractedData = this.extractRentRollMetrics(relevantSheet.data);

      // Use AI to create summary
      const dataPreview = relevantSheet.data
        .slice(0, 20)
        .map((row) => row.slice(0, 10).join("\t"))
        .join("\n");

      const completion = await RentRollAnalyzer.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a real estate analyst. Analyze this rent roll data and provide a concise summary focusing on key metrics like occupancy, rent levels, unit mix, and any notable patterns.",
          },
          {
            role: "user",
            content: `Analyze this rent roll data and provide a 2-3 sentence summary:\n\n${dataPreview}\n\nExtracted metrics: ${JSON.stringify(extractedData, null, 2)}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const summary =
        completion.choices[0]?.message?.content ||
        `Rent roll contains ${relevantSheet.data.length} rows of data with ${extractedData.totalUnits || "unknown"} units.`;

      return { summary, extractedData };
    } catch (error) {
      throw new Error(
        `Failed to analyze spreadsheet rent roll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async analyzeVisualRentRoll(document: DocumentFile): Promise<{
    summary: string;
    extractedData: Record<string, unknown>;
  }> {
    try {
      const base64File = await this.convertFileToBase64(document.file);

      const completion = await RentRollAnalyzer.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a real estate analyst. Analyze this rent roll document and extract key metrics like total units, occupancy rate, average rent, total rent, and provide a summary of findings.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this rent roll document and provide: 1) A concise summary of key findings 2) Extracted metrics in JSON format including totalUnits, occupancyRate, averageRent, totalRent, and keyFindings array.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${document.file.type};base64,${base64File}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || "";

      // Try to extract JSON from response
      let extractedData: Record<string, unknown> = {};
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // If JSON parsing fails, create basic structure
        extractedData = {
          analysisNotes: response,
          extractionMethod: "visual_analysis",
        };
      }

      const summary = response.split("\n")[0] || "Rent roll document analyzed via AI vision.";

      return { summary, extractedData };
    } catch (error) {
      throw new Error(
        `Failed to analyze visual rent roll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private extractRentRollMetrics(data: unknown[][]): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    try {
      // Basic analysis of spreadsheet data
      metrics.totalRows = data.length;
      metrics.totalColumns = data[0]?.length || 0;

      // Look for numeric columns that might represent rent
      const numericColumns = this.findNumericColumns(data);
      if (numericColumns.length > 0) {
        const rentColumn = numericColumns.find((col) => col.sum > 1000); // Likely rent column
        if (rentColumn) {
          metrics.totalRent = rentColumn.sum;
          metrics.averageRent = rentColumn.average;
          metrics.totalUnits = rentColumn.count;
        }
      }

      // Estimate occupancy if possible
      const occupiedUnits = data.filter((row) =>
        row.some(
          (cell) =>
            cell !== null &&
            cell !== undefined &&
            cell !== "" &&
            typeof cell === "number" &&
            cell > 0,
        ),
      ).length;

      if (occupiedUnits > 0 && data.length > 1) {
        metrics.occupancyRate = Math.round((occupiedUnits / (data.length - 1)) * 100); // -1 for header
      }
    } catch (error) {
      metrics.error = `Metrics extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    return metrics;
  }

  private findNumericColumns(data: unknown[][]): Array<{
    columnIndex: number;
    sum: number;
    average: number;
    count: number;
  }> {
    if (data.length < 2) return [];

    const columns: Array<{
      columnIndex: number;
      sum: number;
      average: number;
      count: number;
    }> = [];

    const maxColumns = Math.max(...data.map((row) => row.length));

    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const numbers: number[] = [];

      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        // Skip header
        const cell = data[rowIndex]?.[colIndex];
        if (typeof cell === "number" && !Number.isNaN(cell) && cell > 0) {
          numbers.push(cell);
        }
      }

      if (numbers.length > 0) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        columns.push({
          columnIndex: colIndex,
          sum,
          average: sum / numbers.length,
          count: numbers.length,
        });
      }
    }

    return columns.sort((a, b) => b.sum - a.sum); // Sort by sum descending
  }
}
