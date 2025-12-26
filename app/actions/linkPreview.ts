'use server'

import { load } from 'cheerio'

export interface LinkMetadata {
  url: string
  title: string | null
  description: string | null
  image: string | null
}

export async function fetchLinkMetadata(url: string): Promise<{
  success: boolean
  metadata?: LinkMetadata
  error?: string
}> {
  try {
    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return { success: false, error: 'URL invalide' }
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return { success: false, error: 'Seuls les URLs HTTP et HTTPS sont autorisés' }
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return { success: false, error: `Erreur HTTP: ${response.status}` }
    }

    const html = await response.text()
    const $ = load(html)

    // Extract Open Graph metadata
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDescription = $('meta[property="og:description"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')

    // Fallback to standard HTML metadata
    const title =
      ogTitle ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null

    const description =
      ogDescription ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null

    let image =
      ogImage ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null

    // Make image URL absolute if it's relative
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, validUrl.origin).toString()
      } catch {
        image = null
      }
    }

    return {
      success: true,
      metadata: {
        url: validUrl.toString(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        image,
      },
    }
  } catch (error) {
    console.error('Error fetching link metadata:', error)
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { success: false, error: 'La requête a expiré' }
    }
    return { success: false, error: 'Impossible de récupérer les métadonnées du lien' }
  }
}
