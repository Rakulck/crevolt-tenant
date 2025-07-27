import { Effect } from "effect"

import type { DocumentType } from "@/types/documents"
import type { DocumentAnalyzer } from "@/types/documents/analyzers/base"

import { GenericDocumentAnalyzer } from "./analyzers/GenericDocumentAnalyzer"
import { RentRollAnalyzer } from "./analyzers/RentRollAnalyzer"
import { T12Analyzer } from "./analyzers/T12Analyzer"

export const DocumentAnalyzerFactory = {
  analyzers: new Map<DocumentType, DocumentAnalyzer>(),

  initialize() {
    console.log(
      "🏭 [DocumentAnalyzerFactory] ===== INITIALIZING ANALYZERS =====",
    )

    // Initialize analyzers
    console.log(
      "📊 [DocumentAnalyzerFactory] Registering RentRollAnalyzer for basic rent roll parsing...",
    )
    DocumentAnalyzerFactory.analyzers.set("rent_roll", new RentRollAnalyzer())

    console.log(
      "🧠 [DocumentAnalyzerFactory] Registering TenantDefaultAnalyzer for AI risk analysis...",
    )
    // Note: We'll use a different approach - TenantDefaultAnalyzer should be called separately
    // DocumentAnalyzerFactory.analyzers.set("rent_roll", new TenantDefaultAnalyzer())

    console.log("📈 [DocumentAnalyzerFactory] Registering T12Analyzer...")
    DocumentAnalyzerFactory.analyzers.set("t12", new T12Analyzer())

    console.log(
      "📄 [DocumentAnalyzerFactory] Registering GenericDocumentAnalyzers...",
    )
    DocumentAnalyzerFactory.analyzers.set(
      "underwritten_file",
      new GenericDocumentAnalyzer("underwritten_file"),
    )
    DocumentAnalyzerFactory.analyzers.set(
      "concessions_report",
      new GenericDocumentAnalyzer("concessions_report"),
    )
    DocumentAnalyzerFactory.analyzers.set(
      "floor_plans",
      new GenericDocumentAnalyzer("floor_plans"),
    )
    DocumentAnalyzerFactory.analyzers.set(
      "ground_lease",
      new GenericDocumentAnalyzer("ground_lease"),
    )
    DocumentAnalyzerFactory.analyzers.set(
      "lease_trade_out_report",
      new GenericDocumentAnalyzer("lease_trade_out_report"),
    )

    console.log(
      "✅ [DocumentAnalyzerFactory] All analyzers registered successfully",
    )
    console.log(
      "📋 [DocumentAnalyzerFactory] Available analyzers:",
      Array.from(DocumentAnalyzerFactory.analyzers.keys()),
    )
  },

  getAnalyzer(
    documentType: DocumentType,
  ): Effect.Effect<DocumentAnalyzer, Error> {
    return Effect.sync(() => {
      console.log(
        `🔍 [DocumentAnalyzerFactory] Looking for analyzer for type: ${documentType}`,
      )

      const analyzer = DocumentAnalyzerFactory.analyzers.get(documentType)
      if (!analyzer) {
        console.error(
          `❌ [DocumentAnalyzerFactory] No analyzer found for document type: ${documentType}`,
        )
        console.log(
          "📋 [DocumentAnalyzerFactory] Available analyzers:",
          Array.from(DocumentAnalyzerFactory.analyzers.keys()),
        )
        throw new Error(`No analyzer found for document type: ${documentType}`)
      }

      console.log(
        `✅ [DocumentAnalyzerFactory] Found analyzer for ${documentType}: ${analyzer.constructor.name}`,
      )
      return analyzer
    })
  },

  isDocumentTypeSupported(documentType: DocumentType): boolean {
    const isSupported = DocumentAnalyzerFactory.analyzers.has(documentType)
    console.log(
      `🔍 [DocumentAnalyzerFactory] Document type '${documentType}' supported: ${isSupported}`,
    )
    return isSupported
  },

  getSupportedDocumentTypes(): DocumentType[] {
    const types = Array.from(DocumentAnalyzerFactory.analyzers.keys())
    console.log("📋 [DocumentAnalyzerFactory] Supported document types:", types)
    return types
  },
}

// Initialize analyzers
console.log("🚀 [DocumentAnalyzerFactory] Starting factory initialization...")
DocumentAnalyzerFactory.initialize()
console.log("🎉 [DocumentAnalyzerFactory] Factory initialization complete!")
