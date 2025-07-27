"use client"

import type React from "react"

import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { SUPPORTED_FILE_FORMATS } from "../../constants/tenant-constants"

interface RentRollUploadProps {
  uploadedFile: File | null
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isProcessing?: boolean
  errors?: string[]
  progress?: {
    stage: "processing" | "uploading" | "complete"
    percent: number
    message: string
  }
}

export function RentRollUpload({
  uploadedFile,
  onFileUpload,
  isProcessing = false,
  errors = [],
  progress,
}: RentRollUploadProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Upload className="mt-0.5 h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium text-blue-900">
              Rent Roll Upload
            </h4>
            <p className="text-sm text-blue-700">
              Upload your existing rent roll file and we'll automatically
              extract all tenant information. This is the fastest way to add
              multiple tenants at once.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
        <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-slate-900">
            Upload Rent Roll
          </h4>
          <p className="text-slate-600">
            Upload your rent roll file (Excel, CSV, or PDF) and we'll
            automatically extract tenant information.
          </p>
        </div>
        <div className="mt-6">
          <input
            type="file"
            id="rent-roll-upload"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={onFileUpload}
            className="hidden"
          />
          <Label htmlFor="rent-roll-upload">
            <Button
              variant="outline"
              className="cursor-pointer bg-transparent"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </span>
            </Button>
          </Label>
        </div>
        {uploadedFile && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800">
              <strong>File uploaded:</strong> {uploadedFile.name}
            </p>

            {progress ? (
              <div className="mt-2">
                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-green-100">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-300 ease-in-out"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                {/* Progress Message */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-green-700">
                    {progress.stage === "processing" &&
                      "Processing rent roll..."}
                    {progress.stage === "uploading" && "Finalizing..."}
                    {progress.stage === "complete" && "Complete!"}
                  </span>
                  <span className="font-medium text-green-700">
                    {progress.percent}%
                  </span>
                </div>

                {/* Detailed Status */}
                <p className="mt-1 text-xs text-green-600">
                  {progress.message}
                </p>
              </div>
            ) : isProcessing ? (
              <p className="mt-1 text-xs text-green-600">
                Preparing to process file...
              </p>
            ) : (
              <p className="mt-1 text-xs text-green-600">
                File processed successfully!
              </p>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <h5 className="text-sm font-medium text-red-800">
              Processing Errors:
            </h5>
            <ul className="mt-1 text-xs text-red-600">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="mb-2 font-medium text-slate-900">
          Supported File Formats:
        </h5>
        <ul className="space-y-1 text-sm text-slate-600">
          {SUPPORTED_FILE_FORMATS.map((format, index) => (
            <li key={index}>• {format}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
