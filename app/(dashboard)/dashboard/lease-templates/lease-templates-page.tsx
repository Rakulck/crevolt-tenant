"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, FileText, Upload, Trash2, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface LeaseTemplate {
  id: string
  name: string
  uploadedDate: string
  fileType: string
  fileSize: string
  file?: File
}

export default function LeaseTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<LeaseTemplate[]>([
    {
      id: "1",
      name: "Standard Residential Lease Agreement",
      uploadedDate: "2 days ago",
      fileType: "PDF",
      fileSize: "245 KB",
    },
    {
      id: "2",
      name: "Month-to-Month Rental Agreement",
      uploadedDate: "1 week ago",
      fileType: "DOCX",
      fileSize: "180 KB",
    },
    {
      id: "3",
      name: "Commercial Lease Template",
      uploadedDate: "2 weeks ago",
      fileType: "PDF",
      fileSize: "320 KB",
    },
  ])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadTemplate = () => {
    if (!selectedFile) return

    const newTemplate: LeaseTemplate = {
      id: Date.now().toString(),
      name: selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      uploadedDate: "Just now",
      fileType: selectedFile.name.split(".").pop()?.toUpperCase() || "Unknown",
      fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
      file: selectedFile,
    }

    setTemplates((prev) => [newTemplate, ...prev])
    setSelectedFile(null)

    // Reset file input
    const fileInput = document.getElementById("template-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== templateId))
  }

  const handleDownloadTemplate = (template: LeaseTemplate) => {
    // In a real app, this would download the actual file
    console.log("Downloading template:", template.name)
  }

  const handlePreviewTemplate = (template: LeaseTemplate) => {
    // In a real app, this would open a preview modal or new tab
    console.log("Previewing template:", template.name)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-[#4F46E5]" />
              <h1 className="text-xl font-semibold text-slate-900">Lease Agreement Templates</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Upload New Template Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Upload New Template</CardTitle>
            <CardDescription>Add a new lease agreement template that you can use for your properties.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="template-upload" className="text-sm font-medium text-slate-700 mb-2 block">
                  Choose Template File
                </Label>
                <Input
                  id="template-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="h-11"
                />
                <p className="text-sm text-slate-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
              </div>
              <Button
                onClick={handleUploadTemplate}
                disabled={!selectedFile}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11 px-6"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </Button>
            </div>
            {selectedFile && (
              <div className="mt-4 p-3 bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-md">
                <p className="text-sm text-[#4F46E5]">
                  <strong>Selected file:</strong> {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Your Templates</CardTitle>
            <CardDescription>Manage your lease agreement templates.</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length > 0 ? (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-16 bg-[#4F46E5] rounded-sm flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{template.name}</h3>
                        <p className="text-slate-600 text-sm">
                          Uploaded {template.uploadedDate} • {template.fileType} • {template.fileSize}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        className="bg-transparent"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTemplate(template)}
                        className="bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No templates yet</h3>
                <p className="text-slate-600 mb-4">Upload your first lease agreement template to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#4F46E5]/10 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#4F46E5]" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-1">Template Management Tips</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Keep your lease templates organized and up-to-date. You can upload different templates for different
                  property types and lease terms. Templates can be used when generating lease agreements for your
                  tenants.
                </p>
                <Button variant="link" className="px-0 text-[#4F46E5] hover:text-[#4338CA] text-sm">
                  Learn more about lease templates →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
