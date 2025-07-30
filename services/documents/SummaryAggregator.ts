import type { DealDescriptionRequest } from "@/lib/types/deal-description"
import type { DocumentAnalysisResult } from "@/lib/types/documents"
import { Effect } from "effect"
import OpenAI from "openai"

interface DocumentData {
  content: string
  type: string
  metadata?: Record<string, unknown>
}

export const SummaryAggregator = {
  _openai: null as OpenAI | null,

  getOpenAI(): OpenAI {
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
  },

  async generateSummary(data: DocumentData): Promise<string> {
    try {
      const completion = await SummaryAggregator.getOpenAI().chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [
            // ... existing code ...
          ],
        },
      )

      return completion.choices[0].message.content || ""
    } catch (error) {
      console.error("Error generating summary:", error)
      throw error
    }
  },
}
