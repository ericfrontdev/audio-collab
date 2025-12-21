import { createClient } from '@/lib/supabase/client'

export async function uploadMediaToStorage(
  file: File,
  userId: string,
  mediaType: 'image' | 'audio'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error(`Error uploading ${mediaType}:`, uploadError)
      return { url: null, error: `Failed to upload ${mediaType}` }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('posts').getPublicUrl(uploadData.path)

    return { url: publicUrl, error: null }
  } catch (error: any) {
    console.error(`Error uploading ${mediaType}:`, error)
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
