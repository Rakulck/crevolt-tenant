"use client"

import { useState } from "react"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardHeader } from "@/components/dashboard-header"
import { RentRollUpload } from "@/components/tenant/rent-roll-upload"

interface ProcessingResult {
  success: boolean
  data?: any
  errors?: string[]
  downloadUrl?: string
  fileId?: string
}

export function RentRollParserPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState<{
    stage: "processing" | "uploading" | "complete"
    percent: number
    message: string
  } | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setErrors([])
      setResult(null)
      setProgress(null)
    }
  }

  const processFile = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setErrors([])
    setResult(null)
    
    setProgress({
      stage: "processing",
      percent: 0,
      message: "Uploading file..."
    })

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      setProgress({
        stage: "processing",
        percent: 25,
        message: "Processing rent roll..."
      })

      const response = await fetch("/api/rent-roll-parser", {
        method: "POST",
        body: formData,
      })

      setProgress({
        stage: "uploading",
        percent: 75,
        message: "Finalizing results..."
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process file")
      }

      setProgress({
        stage: "complete",
        percent: 100,
        message: "Processing complete!"
      })

      setResult({
        success: true,
        data: {
          tenantsProcessed: result.data.processingResult.extractedTenants,
          propertiesFound: result.data.processingResult.propertiesFound,
          totalRent: result.data.processingResult.totalRent,
          totalUnits: result.data.processingResult.totalUnits,
        },
        downloadUrl: result.data.downloadUrl,
        fileId: result.data.fileId
      })

    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to process file. Please try again."])
      setProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!result?.fileId) return

    try {
      const response = await fetch("/api/rent-roll-parser/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: result.fileId }),
      })

      if (!response.ok) {
        throw new Error("Failed to download file")
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `processed-rent-roll-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      // You could show a toast notification here
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Rent Roll Parser</h1>
              <p className="text-slate-600">
                Upload your rent roll file and get a processed Excel output with extracted tenant information
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Rent Roll</CardTitle>
              <CardDescription>
                Upload your rent roll file (Excel, CSV, or PDF) and we'll process it to extract tenant information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RentRollUpload
                uploadedFile={uploadedFile}
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                errors={errors}
                progress={progress}
              />
              
              {uploadedFile && !isProcessing && !result && (
                <div className="mt-6">
                  <Button 
                    onClick={processFile}
                    className="w-full"
                    size="lg"
                  >
                    Process Rent Roll
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Processing Results</span>
                </CardTitle>
                <CardDescription>
                  Your rent roll has been successfully processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <FileText className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully processed {result.data?.tenantsProcessed} tenants from {result.data?.propertiesFound} properties
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {result.data?.tenantsProcessed}
                    </div>
                    <div className="text-sm text-slate-600">Tenants Processed</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {result.data?.propertiesFound}
                    </div>
                    <div className="text-sm text-slate-600">Properties Found</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {result.data?.totalUnits}
                    </div>
                    <div className="text-sm text-slate-600">Total Units</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {result.data?.totalRent}
                    </div>
                    <div className="text-sm text-slate-600">Total Monthly Rent</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={handleDownload}
                    className="w-full"
                    size="lg"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Processed Excel File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Upload your rent roll</h4>
                    <p className="text-sm text-slate-600">
                      Upload your existing rent roll file in Excel, CSV, or PDF format
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">AI processing</h4>
                    <p className="text-sm text-slate-600">
                      Our AI analyzes your file and extracts tenant information, property details, and financial data
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Download results</h4>
                    <p className="text-sm text-slate-600">
                      Get a clean, organized Excel file with all extracted information ready for use
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
