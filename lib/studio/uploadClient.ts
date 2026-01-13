/**
 * Upload Client
 *
 * API client for audio file uploads to Supabase Storage.
 */

export interface SignedUploadUrlResponse {
  uploadUrl: string
  filePath: string
  token: string
}

export interface FinalizeUploadResponse {
  success: boolean
  error?: string
  errorDetails?: {
    code?: string
    details?: string
    hint?: string
    message: string
  }
}

export interface UploadProgressCallback {
  (progress: number, loaded: number, total: number, speed: number, elapsed: number): void
}

/**
 * Request a signed upload URL from the API
 *
 * @param trackId - ID of the track to upload to
 * @param fileName - Name of the file
 * @param fileType - MIME type of the file
 * @returns Upload URL, file path, and token
 */
export async function requestSignedUploadUrl(
  trackId: string,
  fileName: string,
  fileType: string
): Promise<SignedUploadUrlResponse> {
  const response = await fetch('/api/generate-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackId,
      fileName,
      fileType,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to generate upload URL')
  }

  return response.json()
}

/**
 * Upload file directly to Supabase Storage with progress tracking
 *
 * @param uploadUrl - Signed URL from requestSignedUploadUrl
 * @param file - File to upload
 * @param onProgress - Progress callback
 * @returns Promise that resolves when upload completes
 */
export async function uploadFileToStorage(
  uploadUrl: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<void> {
  const uploadStartTime = performance.now()

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const uploadPercent = (e.loaded / e.total) * 100
        const elapsed = (performance.now() - uploadStartTime) / 1000
        const speed = e.loaded / 1024 / 1024 / elapsed // MB/s

        onProgress(uploadPercent, e.loaded, e.total, speed, elapsed)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const uploadDuration = ((performance.now() - uploadStartTime) / 1000).toFixed(2)
        console.log(`✅ File uploaded to storage in ${uploadDuration}s`)
        resolve()
      } else {
        reject(new Error(`Storage upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Storage upload failed due to network error'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Storage upload was aborted'))
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.send(file)
  })
}

/**
 * Finalize upload by creating the take record in database
 *
 * @param trackId - ID of the track
 * @param filePath - Storage path of the uploaded file
 * @param fileSize - Size of the file in bytes
 * @param fileFormat - File extension (e.g., "wav")
 * @param waveformData - Optional waveform peaks data
 * @returns Upload result
 */
export async function finalizeUpload(
  trackId: string,
  filePath: string,
  fileSize: number,
  fileFormat: string,
  waveformData: number[] | null
): Promise<FinalizeUploadResponse> {
  const finalizeStartTime = performance.now()

  const response = await fetch('/api/finalize-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackId,
      filePath,
      fileSize,
      fileFormat,
      waveformData,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to finalize upload')
  }

  const result = await response.json()
  const finalizeDuration = ((performance.now() - finalizeStartTime) / 1000).toFixed(2)
  console.log(`✅ Upload finalized in ${finalizeDuration}s:`, result)

  return result
}
