/**
 * Fetches video metadata using YouTube's oEmbed endpoint.
 * FREE — no API key, no quota cost.
 * Returns { title, author_name, thumbnail_url } or null on failure.
 */
export async function fetchOEmbed(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(url)

    if (!res.ok) return null

    const data = await res.json()
    return {
      title: data.title || 'Untitled',
      channel: data.author_name || 'Unknown',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    }
  } catch {
    return null
  }
}
