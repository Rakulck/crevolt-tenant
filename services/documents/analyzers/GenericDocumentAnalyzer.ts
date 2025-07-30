import type {
  DocumentAnalysisResult,
  DocumentFile,
  DocumentType,
} from "@/lib/types/documents"
import { BaseDocumentAnalyzer } from "@/lib/types/documents/analyzers/base"
import { Effect } from "effect"
import OpenAI from "openai"

interface AnalysisTemplate {
  systemPrompt: string
  userPrompt: string
  extractionFields: string[]
}

export class GenericDocumentAnalyzer extends BaseDocumentAnalyzer {
  private static _openai: OpenAI | null = null

  private static getOpenAI(): OpenAI {
    if (!this._openai) {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error(
          "OPENAI_API_KEY environment variable is missing or empty. Please set it in your environment variables."
        )
      }
      this._openai = new OpenAI({
        apiKey: apiKey,
      })
    }
    return this._openai
  }

  private documentType: DocumentType

  constructor(documentType: DocumentType) {
    super()
    this.documentType = documentType
  }

  getSupportedDocumentType(): string {
    return this.documentType
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
          try: () => self.analyzeGenericDocument(document),
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

  private async analyzeGenericDocument(document: DocumentFile): Promise<{
    summary: string
    extractedData: Record<string, unknown>
  }> {
    try {
      const template = this.getAnalysisTemplate(document.type)
      const base64File = await this.convertFileToBase64(document.file)

      const completion =
        await GenericDocumentAnalyzer.getOpenAI().chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: template.systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: template.userPrompt,
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
          max_tokens: 500,
          temperature: 0.3,
        })

      const response = completion.choices[0]?.message?.content || ""

      // Extract structured data from response
      let extractedData: Record<string, unknown> = {}
      try {
        const jsonMatch = response.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0])
        }
      } catch {
        extractedData = this.extractDataFromText(
          response,
          template.extractionFields,
        )
      }

      // Add metadata
      extractedData.documentType = document.type
      extractedData.analysisMethod = "ai_vision"
      extractedData.analysisTimestamp = new Date().toISOString()

      // Extract summary
      const sentences = response.split(/[.!?]+/)
      const summary =
        sentences.slice(0, 2).join(". ").trim() +
        (sentences.length > 2 ? "." : "")

      return {
        summary: summary || `${document.type} document analyzed successfully.`,
        extractedData,
      }
    } catch (error) {
      throw new Error(
        `Failed to analyze ${document.type} document: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  private getAnalysisTemplate(documentType: DocumentType): AnalysisTemplate {
    const templates: Record<DocumentType, AnalysisTemplate> = {
      underwritten_file: {
        systemPrompt:
          "You are a real estate underwriting analyst. Analyze underwritten projections and investment assumptions, focusing on IRR, cash-on-cash returns, equity multiples, and key investment metrics.",
        userPrompt: `Analyze this underwritten investment file and extract:
- Projected IRR (%)
- Cash-on-Cash returns (%)
- Equity Multiple
- Hold period (years)
- Key assumptions and risks
Provide a 2-3 sentence summary and JSON with extracted metrics.`,
        extractionFields: [
          "projectedIRR",
          "projectedCashOnCash",
          "equityMultiple",
          "holdPeriod",
          "keyAssumptions",
        ],
      },
      concessions_report: {
        systemPrompt:
          "You are a leasing analyst. Analyze concessions data including rent reductions, free months, tenant incentives, and their impact on effective rent.",
        userPrompt: `Analyze this concessions report and extract:
- Total concessions amount
- Average concession per unit
- Most common concession types
- Impact on effective rent
Provide a summary and JSON with extracted data.`,
        extractionFields: [
          "totalConcessions",
          "averageConcessionPerUnit",
          "mostCommonConcessions",
          "impactOnRent",
        ],
      },
      floor_plans: {
        systemPrompt:
          "You are an architectural analyst. Analyze floor plans focusing on unit types, square footage, bedroom/bathroom counts, and layout efficiency.",
        userPrompt: `Analyze these floor plans and extract:
- Unit types and configurations
- Average square footage
- Bedroom/bathroom distribution
- Key amenities and features
Provide a summary and JSON with extracted data.`,
        extractionFields: [
          "unitTypes",
          "averageSquareFootage",
          "bedroomDistribution",
          "amenityHighlights",
        ],
      },
      ground_lease: {
        systemPrompt:
          "You are a real estate attorney/analyst. Analyze ground lease terms including lease duration, rent, escalations, and key provisions.",
        userPrompt: `Analyze this ground lease document and extract:
- Lease term (years)
- Annual ground rent
- Escalation provisions
- Key terms and conditions
Provide a summary and JSON with extracted data.`,
        extractionFields: [
          "leaseTermYears",
          "annualRent",
          "escalations",
          "keyTerms",
        ],
      },
      lease_trade_out_report: {
        systemPrompt:
          "You are a leasing analyst. Analyze lease trade-out data including renewal rates, rent increases, tenant retention, and market positioning.",
        userPrompt: `Analyze this lease trade-out report and extract:
- Number of units traded/renewed
- Average rent increase achieved
- Retention rate
- Market trends and insights
Provide a summary and JSON with extracted data.`,
        extractionFields: [
          "unitsTraded",
          "averageRentIncrease",
          "retentionRate",
          "marketTrends",
        ],
      },
      rent_roll: {
        systemPrompt:
          "This should not be used - rent_roll has its own analyzer",
        userPrompt: "",
        extractionFields: [],
      },
      t12: {
        systemPrompt: "This should not be used - t12 has its own analyzer",
        userPrompt: "",
        extractionFields: [],
      },
    }

    return templates[documentType]
  }

  private extractDataFromText(
    text: string,
    fields: string[],
  ): Record<string, unknown> {
    const extracted: Record<string, unknown> = {}

    try {
      // Generic number extraction patterns
      const numberPattern = /([0-9,]+(?:\.[0-9]+)?)/g
      const percentPattern = /([0-9.]+)%/g

      const numbers: number[] = []
      let match: RegExpExecArray | null = numberPattern.exec(text)
      while (match !== null) {
        if (match[1]) {
          const num = Number.parseFloat(match[1].replace(/,/g, ""))
          if (!Number.isNaN(num)) {
            numbers.push(num)
          }
        }
        match = numberPattern.exec(text)
      }

      const percentages: number[] = []
      match = percentPattern.exec(text)
      while (match !== null) {
        if (match[1]) {
          const pct = Number.parseFloat(match[1])
          if (!Number.isNaN(pct)) {
            percentages.push(pct)
          }
        }
        match = percentPattern.exec(text)
      }

      // Simple heuristic mapping based on document type
      if (fields.includes("projectedIRR") && percentages.length > 0) {
        extracted.projectedIRR = percentages[0]
      }
      if (fields.includes("retentionRate") && percentages.length > 0) {
        extracted.retentionRate = percentages[0]
      }
      if (fields.includes("totalConcessions") && numbers.length > 0) {
        extracted.totalConcessions = numbers[0]
      }

      // Extract key findings as an array
      const keyFindings: string[] = []
      if (text.toLowerCase().includes("increase"))
        keyFindings.push("Shows increases")
      if (text.toLowerCase().includes("decrease"))
        keyFindings.push("Shows decreases")
      if (text.toLowerCase().includes("stable"))
        keyFindings.push("Stable performance")

      extracted.keyFindings = keyFindings
      extracted.rawAnalysis = text
    } catch (error) {
      extracted.extractionError = `Failed to extract data: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    return extracted
  }
}
