"use client"

import { useState, useCallback } from "react"
import type { Attachment } from "@/types"

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(async (file: File): Promise<Attachment> => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const result = await response.json()
      setUploadProgress(100)

      return {
        id: result.id,
        type: result.type,
        url: result.url,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
      }
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [])

  const uploadMultipleFiles = useCallback(
    async (files: File[]): Promise<Attachment[]> => {
      const uploadPromises = files.map((file) => uploadFile(file))
      return Promise.all(uploadPromises)
    },
    [uploadFile],
  )

  return {
    uploadFile,
    uploadMultipleFiles,
    uploading,
    uploadProgress,
  }
}
