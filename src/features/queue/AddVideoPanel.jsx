import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import { parseYouTubeUrl } from '../../lib/youtube/parseUrl.js'
import { fetchOEmbed } from '../../lib/youtube/oembed.js'
import { addToQueue } from './queueService.js'
import { useYouTubeSearch } from '../search/useYouTubeSearch.js'
import SearchResults from '../search/SearchResults.jsx'

export default function AddVideoPanel() {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const roomCode = useAppStore((s) => s.roomCode)
  const isAdmin = useAppStore((s) => s.isAdmin)

  const [tab, setTab] = useState('link') // 'link' | 'search'
  const [url, setUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const { results, loading: searching, error: searchError, search, clearResults } =
    useYouTubeSearch()

  async function handlePasteLink(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const videoId = parseYouTubeUrl(url)
    if (!videoId) {
      setError('Could not find a valid YouTube video ID. Check the URL.')
      return
    }

    setLoading(true)
    try {
      const meta = await fetchOEmbed(videoId)
      if (!meta) {
        setError('Could not find this video. It might be private or removed.')
        return
      }

      await addToQueue(roomCode, uid, displayName, {
        videoId,
        title: meta.title,
        channel: meta.channel,
        thumbnail: meta.thumbnail,
        durationSec: 0,
      }, { isAdmin })

      setUrl('')
      setSuccess(`Added: ${meta.title}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      search(searchQuery)
    }
  }

  function handleSearchAdd() {
    setSuccess('Added to queue!')
    setTimeout(() => setSuccess(null), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-neutral-800/50 p-1 rounded-lg">
        <button
          onClick={() => { setTab('link'); clearResults() }}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            tab === 'link'
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          Paste Link
        </button>
        <button
          onClick={() => setTab('search')}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            tab === 'search'
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          Search
        </button>
      </div>

      {/* Paste link form */}
      {tab === 'link' && (
        <form onSubmit={handlePasteLink} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube link"
            className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || url.trim().length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            {loading ? '…' : 'Add'}
          </button>
        </form>
      )}

      {/* Search form */}
      {tab === 'search' && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube"
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={searching || searchQuery.trim().length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {searching ? '…' : '🔍'}
            </button>
          </form>
          {searchError && (
            <p className="text-red-400 text-xs">{searchError}</p>
          )}
          <SearchResults results={results} onAdd={handleSearchAdd} />
        </>
      )}

      {/* Feedback */}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}
    </div>
  )
}
