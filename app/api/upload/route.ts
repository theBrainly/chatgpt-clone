import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rest of the existing upload logic remains the same...
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine resource type
    const resourceType = file.type.startsWith("image/") ? "image" : "raw"

    // Upload to Cloudinary
    const result = await uploadFile(buffer, file.name, resourceType)

    return NextResponse.json({
      id: result.public_id,
      url: result.secure_url,
      name: result.original_filename || file.name,
      size: result.bytes,
      type: file.type.startsWith("image/") ? "image" : "document",
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
