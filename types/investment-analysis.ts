import { z } from "zod"

export const InvestmentAnalysisSchema = z.object({
  executiveSummary: z
    .string()
    .describe("Brief overview of the investment opportunity"),
  investmentHighlights: z
    .array(z.string())
    .describe("Key selling points and highlights of the investment"),
  units: z
    .number()
    .optional()
    .describe("Total number of units in the property"),
  beds: z.number().optional().describe("Number of beds (for student housing)"),
  yearBuilt: z
    .number()
    .optional()
    .describe("Year the property was built (vintage)"),
  sponsor: z.string().optional().describe("General Partner or sponsor name"),
  irr: z.number().optional().describe("Internal Rate of Return percentage"),
  equityMultiple: z.number().optional().describe("Equity Multiple (EM)"),
  cashOnCash: z.number().optional().describe("Cash-on-Cash return percentage"),
})

export type InvestmentAnalysis = z.infer<typeof InvestmentAnalysisSchema>

export const InvestmentAnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: InvestmentAnalysisSchema.optional(),
  error: z.string().optional(),
  processingTimeMs: z.number().optional(),
})

export type InvestmentAnalysisResponse = z.infer<
  typeof InvestmentAnalysisResponseSchema
>
