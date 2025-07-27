import { NextResponse } from "next/server"

import { TenantDefaultAnalyzer } from "@/services/documents/analyzers/TenantDefaultAnalyzer"

import {
  createAnalysisRequest,
  saveRecommendedActions,
  saveRiskAssessments,
  updateAnalysisStatus,
} from "../../../packages/supabase/src/queries/analysis"

export async function POST(request: Request) {
  console.log(
    "🚀 [TenantAnalysisAPI] ===== TENANT ANALYSIS REQUEST RECEIVED =====",
  )

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const propertyId = formData.get("propertyId") as string
    const propertyName = formData.get("propertyName") as string | null
    const propertyAddress = formData.get("propertyAddress") as string | null

    console.log("📄 [TenantAnalysisAPI] Request details:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      propertyId,
      propertyName,
      propertyAddress,
    })

    if (!file || !propertyId) {
      console.error("❌ [TenantAnalysisAPI] Missing required fields")
      return NextResponse.json(
        { success: false, error: "File and property ID required" },
        { status: 400 },
      )
    }

    console.log("🧠 [TenantAnalysisAPI] Creating TenantDefaultAnalyzer...")

    // Create analyzer instance directly
    const analyzer = new TenantDefaultAnalyzer()

    // Create DocumentFile wrapper
    const documentFile = {
      file,
      type: "rent_roll" as const,
      metadata: {
        propertyId,
        propertyName,
        propertyAddress,
      },
    }

    console.log("🎯 [TenantAnalysisAPI] Running tenant default analysis...")

    // Step 1: Create analysis request record
    console.log("📝 [TenantAnalysisAPI] Creating analysis request...")
    const analysisRequestResult = await createAnalysisRequest({
      property_id: propertyId,
      property_name: propertyName || undefined,
      property_address: propertyAddress || undefined,
      include_web_search: true,
      search_location: undefined,
    })

    if (!analysisRequestResult.success) {
      throw new Error(
        `Failed to create analysis request: ${analysisRequestResult.error}`,
      )
    }

    const analysisRequest = analysisRequestResult.data!
    console.log(
      "✅ [TenantAnalysisAPI] Analysis request created:",
      analysisRequest.id,
    )

    // Step 2: Update analysis request status to processing
    await updateAnalysisStatus(analysisRequest.id, "processing")

    try {
      const tenantAnalysisRequest = {
        propertyName: propertyName || null,
        propertyAddress: propertyAddress || null,
        analysisDate: new Date().toISOString(),
        includeWebSearch: true,
        searchLocation: null,
      }

      const analysisResult = await analyzer.analyzeRentRollForDefaults(
        documentFile,
        tenantAnalysisRequest,
      )

      console.log("✅ [TenantAnalysisAPI] Analysis completed successfully:", {
        tenantCount: analysisResult.tenantAssessments.length,
        processingTimeMs: analysisResult.processingTimeMs,
      })

      // DEBUGGING: Log the complete analysis result structure
      console.log("🔍 [TenantAnalysisAPI] FULL ANALYSIS RESULT:")
      console.log(
        "📊 tenantAssessments:",
        JSON.stringify(analysisResult.tenantAssessments, null, 2),
      )
      console.log(
        "🎯 recommendedActions:",
        JSON.stringify(analysisResult.recommendedActions, null, 2),
      )
      console.log("📈 processingTimeMs:", analysisResult.processingTimeMs)
      console.log(
        "🏠 propertyData:",
        JSON.stringify(analysisResult.propertyData, null, 2),
      )

      // Step 3: Save risk assessments to database
      console.log("💾 [TenantAnalysisAPI] Saving risk assessments...")
      const riskAssessments = analysisResult.tenantAssessments.map(
        (assessment: any) => ({
          analysis_request_id: analysisRequest.id,
          tenant_id: null, // Will be linked later if tenant exists
          property_id: propertyId,
          tenant_name: assessment.tenantName,
          unit_number: assessment.unitNumber,
          risk_severity: assessment.riskSeverity,
          default_probability: assessment.defaultProbability,
          confidence_level: assessment.confidence,
          risk_factors: assessment.riskFactors || [],
          protective_factors: assessment.protectiveFactors || [],
          comments: assessment.comments || "No comments available",
          analysis_reasoning: assessment.reasoning,
          data_quality_score: assessment.dataQuality,
        }),
      )

      const saveAssessmentsResult = await saveRiskAssessments(riskAssessments)
      if (!saveAssessmentsResult.success) {
        throw new Error(
          `Failed to save risk assessments: ${saveAssessmentsResult.error}`,
        )
      }

      // Step 4: Save recommended actions to database
      console.log("🎯 [TenantAnalysisAPI] Saving recommended actions...")
      const recommendedActions =
        analysisResult.recommendedActions?.map((action: any) => ({
          risk_assessment_id: saveAssessmentsResult.data?.find(
            (ra) =>
              ra.tenant_name === action.tenantName &&
              ra.unit_number === action.unitNumber,
          )?.id,
          analysis_request_id: analysisRequest.id,
          action_type: action.actionType,
          priority: action.priority,
          timeline: action.timeline,
          description: action.description,
          estimated_cost: action.estimatedCost,
          affected_tenants: [action.tenantName],
          legal_requirements: action.legalRequirements || [],
          tags: action.tags || [],
        })) || []

      if (recommendedActions.length > 0) {
        const saveActionsResult =
          await saveRecommendedActions(recommendedActions)
        if (!saveActionsResult.success) {
          console.warn(
            "⚠️ [TenantAnalysisAPI] Failed to save recommended actions:",
            saveActionsResult.error,
          )
        }
      }

      // Step 5: Update analysis request status to completed
      await updateAnalysisStatus(analysisRequest.id, "completed", {
        processing_time_ms: analysisResult.processingTimeMs,
        total_tenants_analyzed: analysisResult.tenantAssessments.length,
        tenants_at_risk: analysisResult.tenantAssessments.filter(
          (t: any) => t.defaultProbability > 30,
        ).length,
        average_risk_probability:
          analysisResult.tenantAssessments.reduce(
            (sum: number, t: any) => sum + t.defaultProbability,
            0,
          ) / analysisResult.tenantAssessments.length,
      })

      console.log("✅ [TenantAnalysisAPI] Analysis results saved to database")

      return NextResponse.json({
        success: true,
        message: "Tenant default analysis completed and saved",
        analyzer_available: true,
        integration_status: "Fully integrated and working",
        analysis_request_id: analysisRequest.id,
        result: {
          success: true,
          extractedData: { tenantDefaultAnalysis: analysisResult },
          processingTimeMs: analysisResult.processingTimeMs,
        },
      })
    } catch (analysisError) {
      // Update analysis request status to failed
      await updateAnalysisStatus(analysisRequest.id, "failed", {
        error_message:
          analysisError instanceof Error
            ? analysisError.message
            : "Unknown error",
      })

      throw new Error(
        `Analysis failed: ${analysisError instanceof Error ? analysisError.message : "Unknown error"}`,
      )
    }
  } catch (error) {
    console.error("💥 [TenantAnalysisAPI] Analysis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
        analyzer_available: true,
        integration_status: "Analyzer available but analysis failed",
      },
      { status: 500 },
    )
  }
}
