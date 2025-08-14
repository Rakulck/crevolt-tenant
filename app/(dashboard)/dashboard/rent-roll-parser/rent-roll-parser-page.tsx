"use client"

import { useState } from "react"

import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

import { DashboardHeader } from "../../../../components/dashboard-header"
import { ErrorBoundary } from "../../../../components/error-boundary"
import { RentRollUpload } from "../../../../components/tenant/rent-roll-upload"
import { RentRollProcessorService } from "../../../../services/rent-roll"

interface ProcessingResult {
  success: boolean
  data?: Record<string, unknown>
  errors?: string[]
  downloadUrl?: string
}

export default function RentRollParserPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingErrors, setProcessingErrors] = useState<string[]>([])
  const [processingProgress, setProcessingProgress] = useState<{
    stage: "processing" | "uploading" | "complete"
    percent: number
    message: string
  } | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setProcessingErrors([])
    setProcessingResult(null)
    setIsProcessing(true)
          setProcessingProgress({
        stage: "processing",
        percent: 0,
        message: "Starting file analysis...",
      })

    try {
      // Simulate processing stages
      await simulateProcessing()

      // Process the file (this would integrate with your existing rent roll processing logic)
      const result = await processRentRollFile(file)

      setProcessingResult(result)

      if (result.success) {
        toast({
          title: "Rent Roll Processed Successfully",
          description: "Your rent roll has been analyzed and processed. You can now download the results.",
        })
      } else {
        setProcessingErrors(result.errors || ["Unknown processing error"])
        toast({
          title: "Processing Failed",
          description: "There was an error processing your rent roll file.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Rent roll processing error:", error)
      setProcessingErrors(["Failed to process rent roll file"])
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred while processing your file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(null)
    }
  }

  const simulateProcessing = async () => {
    // Simulate processing stages for better UX
    const stages = [
      { percent: 20, message: "Analyzing file structure..." },
      { percent: 40, message: "Extracting tenant data..." },
      { percent: 60, message: "Processing financial information..." },
      { percent: 80, message: "Generating analysis report..." },
      { percent: 100, message: "Processing complete!" },
    ]

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setProcessingProgress({
        stage: "processing",
        percent: stage.percent,
        message: stage.message,
      })
    }
  }

  const processRentRollFile = async (file: File): Promise<ProcessingResult> => {
    try {
      // Use the existing RentRollProcessorService
      const processingResult = await RentRollProcessorService.processFile(file, {
        onProgress: (processed, total, stage) => {
          const percent = Math.round((processed / total) * 100)
          setProcessingProgress({
            stage: "processing",
            percent,
            message:
              stage === "headers"
                ? `Analyzing column headers (${percent}%)`
                : stage === "data"
                ? `Extracting tenant data (${percent}%)`
                : `Converting data (${percent}%)`,
          })
        },
      })

      if (!processingResult.success || processingResult.extractedTenants.length === 0) {
        return {
          success: false,
          errors: processingResult.errors.length > 0
            ? processingResult.errors
            : ["No tenant data found in the file"],
        }
      }

      // Calculate summary statistics
      const totalUnits = processingResult.sheets.reduce(
        (sum, sheet) => sum + sheet.data.length,
        0,
      )
      const occupiedUnits = processingResult.sheets.reduce(
        (sum, sheet) => sum + sheet.data.filter(unit => unit.occupancy_status === "occupied").length,
        0,
      )
      const totalRent = processingResult.sheets.reduce(
        (sum, sheet) => sum + sheet.data.reduce((sheetSum, unit) => sheetSum + (unit.current_rent || 0), 0),
        0,
      )

      const summaryData = {
        totalTenants: processingResult.extractedTenants.length,
        totalUnits,
        occupiedUnits,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100 * 10) / 10 : 0,
        averageRent: totalUnits > 0 ? Math.round(totalRent / totalUnits) : 0,
        totalRevenue: totalRent,
        sheetsProcessed: processingResult.sheets.length,
        processingTimeMs: processingResult.processingTimeMs,
      }

      // Generate Excel download (this would be implemented with a proper Excel generation library)
      const downloadUrl = await generateExcelDownload(processingResult, summaryData)

      return {
        success: true,
        data: summaryData,
        downloadUrl,
        processingResult, // Store the full result for potential use
      }
    } catch (error) {
      console.error("Rent roll processing error:", error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown processing error"],
      }
    }
  }

  const handleDownloadResults = () => {
    if (processingResult?.downloadUrl) {
      // Trigger download
      const link = document.createElement('a')
      link.href = processingResult.downloadUrl
      link.download = `rent-roll-analysis-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      setTimeout(() => {
        if (processingResult.downloadUrl) {
          URL.revokeObjectURL(processingResult.downloadUrl)
        }
      }, 1000)
    }
  }

  const generateExcelDownload = async (processingResult: Record<string, unknown>, summaryData: Record<string, unknown>): Promise<string> => {
    // For now, we'll create a simple CSV download
    // In a production environment, you'd use a library like 'xlsx' or 'exceljs'

    const csvContent = generateCSVContent(processingResult, summaryData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    return url
  }

  const generateCSVContent = (processingResult: Record<string, unknown>, summaryData: Record<string, unknown>): string => {
    const lines: string[] = []

    // Add summary section
    lines.push("RENT ROLL ANALYSIS SUMMARY")
    lines.push("")
    lines.push(`Total Tenants,${summaryData.totalTenants}`)
    lines.push(`Total Units,${summaryData.totalUnits}`)
    lines.push(`Occupied Units,${summaryData.occupiedUnits}`)
    lines.push(`Occupancy Rate,${summaryData.occupancyRate}%`)
    lines.push(`Average Rent,$${summaryData.averageRent}`)
    lines.push(`Total Revenue,$${summaryData.totalRevenue}`)
    lines.push(`Sheets Processed,${summaryData.sheetsProcessed}`)
    lines.push(`Processing Time,${summaryData.processingTimeMs}ms`)
    lines.push("")

    // Add tenant data
    lines.push("TENANT DETAILS")
    lines.push("Tenant Name,Unit Number,Current Rent,Lease Start,Lease End,Occupancy Status,Square Footage")

    const extractedTenants = processingResult.extractedTenants as Array<Record<string, unknown>>
    extractedTenants.forEach((tenant) => {
      lines.push([
        tenant.tenantName,
        tenant.unitNumber,
        tenant.currentRent,
        tenant.leaseStartDate,
        tenant.leaseEndDate,
        tenant.occupancyStatus,
        tenant.squareFootage,
      ].join(","))
    })

    return lines.join("\n")
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <ErrorBoundary>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Rent Roll Parser
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Upload your rent roll file and get a comprehensive CSV analysis with tenant insights,
                    financial metrics, and risk assessments.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-6">
              <RentRollUpload
                uploadedFile={uploadedFile}
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                errors={processingErrors}
                progress={processingProgress}
              />

              {processingResult?.success && (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-green-900">
                        Analysis Complete!
                      </h4>
                      <p className="text-sm text-green-700">
                        Your rent roll has been successfully processed and analyzed.
                      </p>
                      {processingResult.data && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-green-800">Total Tenants:</span>{" "}
                            <span className="text-green-700">{processingResult.data.totalTenants}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-800">Total Units:</span>{" "}
                            <span className="text-green-700">{processingResult.data.totalUnits}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-800">Occupancy Rate:</span>{" "}
                            <span className="text-green-700">{processingResult.data.occupancyRate}%</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-800">Average Rent:</span>{" "}
                            <span className="text-green-700">${processingResult.data.averageRent}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleDownloadResults}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                What You&apos;ll Get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Tenant Analysis</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Tenant demographics and contact information</li>
                    <li>• Lease terms and renewal dates</li>
                    <li>• Payment history and credit scores</li>
                    <li>• Risk assessment for each tenant</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Financial Metrics</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Revenue analysis and projections</li>
                    <li>• Occupancy rates and trends</li>
                    <li>• Rent roll summaries by property</li>
                    <li>• Cash flow forecasting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </main>
    </div>
  )
}
