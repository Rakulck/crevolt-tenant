import type {
  DocumentAnalysisResult,
  DocumentFile,
} from "@/lib/types/documents"
import { BaseDocumentAnalyzer } from "@/lib/types/documents/analyzers/base"
import { Effect } from "effect"
import OpenAI from "openai"

export class T12Analyzer extends BaseDocumentAnalyzer {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  getSupportedDocumentType(): string {
    return "t12"
  }

  analyzeDocument(
    document: DocumentFile,
  ): Effect.Effect<DocumentAnalysisResult, Error> {
    const startTime = Date.now()
    const self = this
    return Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          self.validateFile(document.file)
        }),
      )
      const analysisResult: {
        summary: string
        extractedData: Record<string, unknown>
      } = yield* _(
        Effect.tryPromise({
          try: () => self.analyzeT12Document(document),
          catch: (e: unknown) => e as Error,
        }),
      )
      const processingTime = Date.now() - startTime

      return self.createAnalysisResult(
        document,
        true,
        analysisResult.summary,
        analysisResult.extractedData,
        undefined,
        processingTime,
      )
    }).pipe(
      Effect.catchAll((error: unknown) => {
        const processingTime = Date.now() - startTime
        return Effect.succeed(
          self.createAnalysisResult(
            document,
            false,
            undefined,
            undefined,
            error instanceof Error ? error.message : "Unknown error",
            processingTime,
          ),
        )
      }),
    )
  }

  private async analyzeT12Document(document: DocumentFile): Promise<{
    summary: string
    extractedData: Record<string, unknown>
  }> {
    try {
      const base64File = await this.convertFileToBase64(document.file)

      const completion = await T12Analyzer.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a real estate financial analyst specializing in T12 (Trailing 12 months) operating statements. 
            
            Analyze the document and extract key financial metrics including:
            - Net Operating Income (NOI)
            - Gross Rent/Revenue
            - Operating Expenses by category
            - Cap Rate (if available)
            - Key performance metrics and trends
            
            Provide a concise summary and structured data extraction.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this T12 operating statement and provide:

1. A 2-3 sentence summary of the property's financial performance
2. Extract key metrics in JSON format including:
   - netOperatingIncome
   - grossRent
   - totalExpenses
   - capRate (if mentioned)
   - keyMetrics (array of important findings)
   - expenseBreakdown (if detailed expenses are shown)

Focus on the trailing 12-month period and highlight any notable trends or performance indicators.`,
              },
              {
                type: "file",
                file: {
                  filename: document.file.name,
                  file_data: `data:${document.file.type};base64,${base64File}`,
                },
              },
            ],
          },
        ],
        max_tokens: 600,
        temperature: 0.2,
      })

      const response = completion.choices[0]?.message?.content || ""

      // Extract structured data from response
      let extractedData: Record<string, unknown> = {}
      try {
        // Look for JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0])
        }

        // Add metadata
        extractedData.documentType = "t12"
        extractedData.analysisMethod = "ai_vision"
        extractedData.analysisTimestamp = new Date().toISOString()
      } catch {
        // Fallback if JSON parsing fails
        extractedData = this.extractMetricsFromText(response)
      }

      // Extract summary (usually the first few sentences)
      const sentences = response.split(/[.!?]+/)
      const summary =
        sentences.slice(0, 2).join(". ").trim() +
        (sentences.length > 2 ? "." : "")

      return {
        summary: summary || "T12 operating statement analyzed successfully.",
        extractedData,
      }
    } catch (error) {
      throw new Error(
        `Failed to analyze T12 document: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  private extractMetricsFromText(text: string): Record<string, unknown> {
    const metrics: Record<string, unknown> = {}

    try {
      // Extract numerical values with context
      const patterns = {
        netOperatingIncome:
          /(?:noi|net operating income|net income)[\s:$]*([0-9,]+)/i,
        grossRent:
          /(?:gross rent|gross revenue|total revenue)[\s:$]*([0-9,]+)/i,
        totalExpenses: /(?:total expenses|operating expenses)[\s:$]*([0-9,]+)/i,
        capRate: /(?:cap rate|capitalization rate)[\s:]*([0-9.]+)%?/i,
      }

      for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern)
        if (match?.[1]) {
          const value =
            key === "capRate"
              ? Number.parseFloat(match[1])
              : Number.parseInt(match[1].replace(/,/g, ""), 10)

          if (!Number.isNaN(value)) {
            metrics[key] = value
          }
        }
      }

      // Extract key findings
      const keyFindings: string[] = []
      if (text.includes("increase") || text.includes("growth")) {
        keyFindings.push("Showing growth trends")
      }
      if (text.includes("decrease") || text.includes("decline")) {
        keyFindings.push("Showing declining performance")
      }
      if (text.includes("stable") || text.includes("consistent")) {
        keyFindings.push("Stable performance")
      }

      metrics.keyMetrics = keyFindings
      metrics.rawAnalysis = text
    } catch (error) {
      metrics.extractionError = `Failed to extract metrics: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    return metrics
  }
}
