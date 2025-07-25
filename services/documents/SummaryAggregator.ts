import type { DealDescriptionRequest } from "@/lib/types/deal-description";
import type { DocumentAnalysisResult } from "@/lib/types/documents";
import { Effect } from "effect";
import OpenAI from "openai";

interface DocumentData {
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export const SummaryAggregator = {
  openai: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),

  async generateSummary(data: DocumentData): Promise<string> {
    try {
      const completion = await SummaryAggregator.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          // ... existing code ...
        ],
      });

      return completion.choices[0].message.content || "";
    } catch (error) {
      console.error("Error generating summary:", error);
      throw error;
    }
  }
};
