import { createClient } from '@/lib/supabase/client'

export async function uploadMediaToStorage(
  file: File,
  userId: string,
  mediaType: 'image' | 'audio',
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Simulate progress for better UX (Supabase doesn't provide native progress)
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 10
      if (progress <= 90 && onProgress) {
        onProgress(progress)
      }
    }, 200)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    clearInterval(progressInterval)

    if (uploadError) {
      console.error(`Error uploading ${mediaType}:`, uploadError)
      if (onProgress) onProgress(0)
      return { url: null, error: `Failed to upload ${mediaType}` }
    }

    if (onProgress) onProgress(100)

    const {
      data: { publicUrl },
    } = supabase.storage.from('posts').getPublicUrl(uploadData.path)

    return { url: publicUrl, error: null }
  } catch (error: any) {
    console.error(`Error uploading ${mediaType}:`, error)
    if (onProgress) onProgress(0)
    return { url: null, error: error.message || `Failed to upload ${mediaType}` }
  }
}

export async function deleteMediaFromStorage(mediaUrl: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Extract file path from URL
    const urlParts = mediaUrl.split('/posts/')
    if (urlParts.length < 2) return false

    const filePath = urlParts[1]

    const { error } = await supabase.storage.from('posts').remove([filePath])

    if (error) {
      console.error('Error deleting media:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting media:', error)
    return false
  }
}
