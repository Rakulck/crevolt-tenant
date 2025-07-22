"use client"

import type React from "react"

import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SUPPORTED_FILE_FORMATS } from "../../constants/tenant-constants"

interface RentRollUploadProps {
  uploadedFile: File | null
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function RentRollUpload({ uploadedFile, onFileUpload }: RentRollUploadProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Rent Roll Upload</h4>
            <p className="text-sm text-blue-700">
              Upload your existing rent roll file and we'll automatically extract all tenant information. This is the
              fastest way to add multiple tenants at once.
            </p>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-slate-900">Upload Rent Roll</h4>
          <p className="text-slate-600">
            Upload your rent roll file (Excel, CSV, or PDF) and we'll automatically extract tenant information.
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
            <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </span>
            </Button>
          </Label>
        </div>
        {uploadedFile && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>File uploaded:</strong> {uploadedFile.name}
            </p>
            <p className="text-xs text-green-600 mt-1">Processing file... This may take a few moments.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-lg">
        <h5 className="font-medium text-slate-900 mb-2">Supported File Formats:</h5>
        <ul className="text-sm text-slate-600 space-y-1">
          {SUPPORTED_FILE_FORMATS.map((format, index) => (
            <li key={index}>• {format}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
