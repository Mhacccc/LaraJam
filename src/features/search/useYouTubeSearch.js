import { useState, useRef } from 'react'

/**
 * Calls the Vercel search proxy. Caches results client-side by query.
 * Never fires on keystroke — only on explicit submit.
 */
export function useYouTubeSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cacheRef = useRef({})

  async function search(query) {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return

    // Check client-side cache
    if (cacheRef.current[normalized]) {
      setResults(cacheRef.current[normalized])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(normalized)}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Search failed')
      }

      const data = await res.json()
      const items = data.items || []

      // Cache it
      cacheRef.current[normalized] = items
      setResults(items)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clearResults() {
    setResults([])
    setError(null)
  }

  return { results, loading, error, search, clearResults }
}
