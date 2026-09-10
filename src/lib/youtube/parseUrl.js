/**
 * Extracts a YouTube video ID from various URL formats:
 *   - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   - https://youtu.be/dQw4w9WgXcQ
 *   - https://youtube.com/shorts/dQw4w9WgXcQ
 *   - https://www.youtube.com/embed/dQw4w9WgXcQ
 *   - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 *   - Just the ID: dQw4w9WgXcQ
 *
 * Returns the 11-character video ID or null if unparseable.
 */
export function parseYouTubeUrl(input) {
  if (!input || typeof input !== 'string') return null

  const trimmed = input.trim()

  // Bare video ID (11 characters, alphanumeric + dash + underscore)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace('www.', '').replace('m.', '')

    if (host === 'youtube.com') {
      // /watch?v=ID
      if (url.pathname === '/watch') {
        return url.searchParams.get('v') || null
      }
      // /shorts/ID or /embed/ID
      const match = url.pathname.match(/^\/(shorts|embed)\/([a-zA-Z0-9_-]{11})/)
      return match ? match[2] : null
    }

    if (host === 'youtu.be') {
      // youtu.be/ID
      const id = url.pathname.slice(1).split('/')[0]
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
  } catch {
    // Not a valid URL
  }

  return null
}
