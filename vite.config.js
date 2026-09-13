import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'youtube-search-dev-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url.startsWith('/api/youtube-search')) {
              return next()
            }

            const url = new URL(req.url, 'http://localhost')
            const query = (url.searchParams.get('q') || '').trim()

            if (!query) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing search query (?q=...)' }))
              return
            }

            const apiKey =
              process.env.YOUTUBE_API_KEY ||
              env.YOUTUBE_API_KEY ||
              env.VITE_YOUTUBE_API_KEY

            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error:
                    'YouTube API key not configured. Add YOUTUBE_API_KEY to your .env.local file.',
                })
              )
              return
            }

            try {
              const searchUrl = new URL(
                'https://www.googleapis.com/youtube/v3/search'
              )
              searchUrl.searchParams.set('part', 'snippet')
              searchUrl.searchParams.set('q', query)
              searchUrl.searchParams.set('type', 'video')
              searchUrl.searchParams.set('videoEmbeddable', 'true')
              searchUrl.searchParams.set('maxResults', '12')
              searchUrl.searchParams.set('key', apiKey)

              const searchRes = await fetch(searchUrl.toString())
              if (!searchRes.ok) {
                const err = await searchRes.json().catch(() => ({}))
                res.statusCode = searchRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    error: err.error?.message || 'YouTube search failed',
                  })
                )
                return
              }

              const searchData = await searchRes.json()
              const videoIds = (searchData.items || [])
                .map((item) => item.id.videoId)
                .join(',')

              if (!videoIds) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ items: [] }))
                return
              }

              const videosUrl = new URL(
                'https://www.googleapis.com/youtube/v3/videos'
              )
              videosUrl.searchParams.set('part', 'contentDetails,status')
              videosUrl.searchParams.set('id', videoIds)
              videosUrl.searchParams.set('key', apiKey)

              const videosRes = await fetch(videosUrl.toString())
              const videosData = await videosRes.json()

              const detailsMap = {}
              for (const v of videosData.items || []) {
                const match = (v.contentDetails?.duration || '').match(
                  /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
                )
                let sec = 0
                if (match) {
                  sec =
                    parseInt(match[1] || '0', 10) * 3600 +
                    parseInt(match[2] || '0', 10) * 60 +
                    parseInt(match[3] || '0', 10)
                }
                detailsMap[v.id] = {
                  durationSec: sec,
                  embeddable: v.status?.embeddable ?? false,
                }
              }

              const items = searchData.items
                .map((item) => {
                  const details = detailsMap[item.id.videoId] || {}
                  return {
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    channel: item.snippet.channelTitle,
                    thumbnail:
                      item.snippet.thumbnails?.medium?.url ||
                      `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
                    durationSec: details.durationSec || 0,
                    embeddable: details.embeddable ?? true,
                  }
                })
                .filter((item) => item.embeddable)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ items }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: err.message || 'Internal server error',
                })
              )
            }
          })
        },
      },
    ],
  }
})
