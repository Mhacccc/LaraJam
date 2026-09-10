/**
 * Vercel serverless function — proxies YouTube Data API search requests.
 * Keeps the API key server-side and caches results at the edge.
 *
 * GET /api/youtube-search?q=lofi+hip+hop
 *
 * Returns: { items: [{ videoId, title, channel, thumbnail, durationSec, embeddable }] }
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = (req.query.q || '').trim()
  if (!query) {
    return res.status(400).json({ error: 'Missing search query (?q=...)' })
  }

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' })
  }

  try {
    // Step 1: Search (costs 1 from the 100/day search bucket)
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('videoEmbeddable', 'true')
    searchUrl.searchParams.set('maxResults', '12')
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY)

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) {
      const err = await searchRes.json().catch(() => ({}))
      console.error('YouTube search error:', err)
      return res.status(searchRes.status).json({ error: 'YouTube search failed' })
    }

    const searchData = await searchRes.json()
    const videoIds = searchData.items.map((item) => item.id.videoId).join(',')

    if (!videoIds) {
      return res.status(200).json({ items: [] })
    }

    // Step 2: Get durations and embeddable status (costs 1 unit from the 10k pool)
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videosUrl.searchParams.set('part', 'contentDetails,status')
    videosUrl.searchParams.set('id', videoIds)
    videosUrl.searchParams.set('key', YOUTUBE_API_KEY)

    const videosRes = await fetch(videosUrl.toString())
    const videosData = await videosRes.json()

    // Build a map of videoId → { durationSec, embeddable }
    const detailsMap = {}
    for (const v of videosData.items || []) {
      detailsMap[v.id] = {
        durationSec: parseDuration(v.contentDetails?.duration),
        embeddable: v.status?.embeddable ?? false,
      }
    }

    // Merge search results with details
    const items = searchData.items
      .map((item) => {
        const details = detailsMap[item.id.videoId] || {}
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
          durationSec: details.durationSec || 0,
          embeddable: details.embeddable ?? true,
        }
      })
      .filter((item) => item.embeddable)

    // Cache at Vercel edge for 24 hours — repeated searches cost nothing
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json({ items })
  } catch (err) {
    console.error('YouTube search proxy error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/** Parses ISO 8601 duration (PT4M13S) to seconds */
function parseDuration(iso) {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (
    parseInt(match[1] || '0', 10) * 3600 +
    parseInt(match[2] || '0', 10) * 60 +
    parseInt(match[3] || '0', 10)
  )
}
