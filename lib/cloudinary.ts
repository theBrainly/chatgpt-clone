import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  resource_type: string
  format: string
  bytes: number
  original_filename: string
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  resourceType: "image" | "raw" = "image",
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          public_id: `chatgpt-clone/${Date.now()}-${filename}`,
          use_filename: true,
          unique_filename: false,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result as UploadResult)
          }
        },
      )
      .end(file)
  })
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
