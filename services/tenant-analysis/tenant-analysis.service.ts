import type { Database } from "@/packages/supabase/src/types/db"

export interface TenantAnalysisRequest {
  file: File
  propertyId: string
  propertyName?: string
  propertyAddress?: string
}

export interface TenantRiskAssessment {
  tenantName: string
  unitNumber: string
  defaultProbability: number
  riskSeverity: Database["public"]["Enums"]["risk_severity"]
  riskFactors: string[]
  protectiveFactors: string[]
  comments: string
  confidence: number
}

export interface RecommendedAction {
  tenantName: string
  unitNumber: string
  actionType: Database["public"]["Enums"]["next_action_type"]
  priority: Database["public"]["Enums"]["priority_level"]
  timeline: string
  description: string
}

// Main analysis result interface
export interface TenantAnalysisResult {
  success: boolean
  propertyInfo?: {
    propertyName: string
    totalUnits: number
    occupancyRate: number
  }
  tenantAssessments: TenantRiskAssessment[]
  recommendedActions: RecommendedAction[]
  overallSummary: {
    averageRisk: number
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
    totalAssessed: number
  }
  processingTimeMs: number
  error?: string
  message?: string
}

export class TenantAnalysisService {
  private static readonly API_ENDPOINT = "/api/tenant-analysis"

  static async analyzeFile(
    request: TenantAnalysisRequest,
  ): Promise<TenantAnalysisResult> {
    const startTime = Date.now()

    console.log(
      "🧠 [TenantAnalysisService] ===== STARTING ANALYSIS REQUEST =====",
    )
    console.log("🧠 [TenantAnalysisService] Request details:", {
      fileName: request.file.name,
      fileSize: request.file.size,
      propertyId: request.propertyId,
      propertyName: request.propertyName,
    })

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("file", request.file)
      formData.append("propertyId", request.propertyId)

      if (request.propertyName) {
        formData.append("propertyName", request.propertyName)
      }

      if (request.propertyAddress) {
        formData.append("propertyAddress", request.propertyAddress)
      }

      console.log("📡 [TenantAnalysisService] Sending request to API...")

      // Make API request
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }))
        throw new Error(
          `API request failed: ${response.status} - ${errorData.error}`,
        )
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      console.log("✅ [TenantAnalysisService] Analysis completed successfully!")
      console.log("📊 [TenantAnalysisService] API Response:", {
        success: result.success,
        analyzer_available: result.analyzer_available,
        integration_status: result.integration_status,
        processingTimeMs: processingTime,
      })

      // Check if the API returned actual analysis results
      if (
        result.result &&
        result.result.extractedData &&
        result.result.extractedData.tenantDefaultAnalysis
      ) {
        console.log(
          "🎯 [TenantAnalysisService] Processing real analysis results...",
        )
        return this.processAnalysisResults(
          result.result.extractedData.tenantDefaultAnalysis,
          processingTime,
        )
      }

      // If no analysis results yet, return a placeholder indicating analysis is in progress
      console.log(
        "⚠️ [TenantAnalysisService] No analysis results available yet - API integration confirmed",
      )
      return {
        success: true,
        tenantAssessments: [],
        recommendedActions: [],
        overallSummary: {
          averageRisk: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          totalAssessed: 0,
        },
        processingTimeMs: processingTime,
        message:
          "Analysis integration confirmed. Full AI analysis will be available when TenantDefaultAnalyzer is fully connected.",
      }
    } catch (error) {
      const processingTime = Date.now() - startTime

      console.error("💥 [TenantAnalysisService] Analysis failed:", error)

      return {
        success: false,
        tenantAssessments: [],
        recommendedActions: [],
        overallSummary: {
          averageRisk: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          totalAssessed: 0,
        },
        processingTimeMs: processingTime,
        error: error instanceof Error ? error.message : "Analysis failed",
      }
    }
  }

  private static processAnalysisResults(
    analysisData: any,
    processingTime: number,
  ): TenantAnalysisResult {
    console.log(
      "🔄 [TenantAnalysisService] Processing real analysis results...",
    )

    try {
      // Extract tenant assessments from AI analysis results
      const tenantAssessments: TenantRiskAssessment[] =
        analysisData.tenantAssessments?.map((assessment: any) => ({
          tenantName: assessment.tenantName || assessment.tenant_name,
          unitNumber: assessment.unitNumber || assessment.unit_number,
          defaultProbability:
            assessment.defaultProbability ||
            assessment.default_probability ||
            0,
          riskSeverity:
            assessment.riskSeverity || assessment.risk_severity || "low",
          riskFactors: assessment.riskFactors || assessment.risk_factors || [],
          protectiveFactors:
            assessment.protectiveFactors || assessment.protective_factors || [],
          comments: assessment.comments || "No comments available",
          confidence: assessment.confidence || assessment.confidence_level || 0,
        })) || []

      // Extract recommended actions
      const recommendedActions: RecommendedAction[] =
        analysisData.recommendedActions?.map((action: any) => ({
          tenantName: action.tenantName || action.tenant_name,
          unitNumber: action.unitNumber || action.unit_number,
          actionType: action.actionType || action.action_type,
          priority: action.priority || action.priority_level || "normal",
          timeline: action.timeline || "TBD",
          description: action.description || "No description available",
        })) || []

      // Calculate summary statistics
      const totalAssessed = tenantAssessments.length
      const averageRisk =
        totalAssessed > 0
          ? tenantAssessments.reduce(
              (sum, t) => sum + t.defaultProbability,
              0,
            ) / totalAssessed
          : 0
      const highRiskCount = tenantAssessments.filter(
        (t) => t.defaultProbability >= 60,
      ).length
      const mediumRiskCount = tenantAssessments.filter(
        (t) => t.defaultProbability >= 30 && t.defaultProbability < 60,
      ).length
      const lowRiskCount = tenantAssessments.filter(
        (t) => t.defaultProbability < 30,
      ).length

      console.log(
        "✅ [TenantAnalysisService] Real analysis results processed:",
        {
          totalAssessed,
          averageRisk: Math.round(averageRisk * 10) / 10,
          actionsCount: recommendedActions.length,
        },
      )

      return {
        success: true,
        propertyInfo: {
          propertyName: analysisData.propertyInfo?.propertyName || "Property",
          totalUnits: analysisData.propertyInfo?.totalUnits || totalAssessed,
          occupancyRate: analysisData.propertyInfo?.occupancyRate || 0,
        },
        tenantAssessments,
        recommendedActions,
        overallSummary: {
          averageRisk: Math.round(averageRisk * 10) / 10,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          totalAssessed,
        },
        processingTimeMs: processingTime,
      }
    } catch (error) {
      console.error(
        "❌ [TenantAnalysisService] Error processing analysis results:",
        error,
      )
      throw new Error("Failed to process analysis results")
    }
  }

  static getRiskColor(probability: number): string {
    if (probability >= 60) return "text-red-600"
    if (probability >= 30) return "text-orange-500"
    if (probability >= 15) return "text-yellow-600"
    return "text-green-600"
  }

  static getRiskBgColor(probability: number): string {
    if (probability >= 60) return "bg-red-100"
    if (probability >= 30) return "bg-orange-100"
    if (probability >= 15) return "bg-yellow-100"
    return "bg-green-100"
  }

  static getPriorityColor(priority: RecommendedAction["priority"]): string {
    switch (priority) {
      case "immediate":
        return "text-red-700 bg-red-100"
      case "urgent":
        return "text-orange-700 bg-orange-100"
      case "normal":
        return "text-blue-700 bg-blue-100"
      case "low":
        return "text-gray-700 bg-gray-100"
      default:
        return "text-gray-700 bg-gray-100"
    }
  }
}
