import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Search, Loader2, X } from 'lucide-react'
import { geocodingApi, type GeocodingResult } from '../../api/geocoding'

interface AddressAutocompleteProps {
  label: string
  value: string
  placeholder?: string
  onSelect: (result: GeocodingResult) => void
  onClear?: () => void
}

export default function AddressAutocomplete({ label, value, placeholder, onSelect, onClear }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await geocodingApi.search(q)
      if (response.success && response.data) {
        setResults(response.data)
        setIsOpen(response.data.length > 0)
      } else {
        setResults([])
        setIsOpen(false)
      }
    } catch {
      setError('Adres aranirken hata olustu')
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.displayName)
    setIsOpen(false)
    setResults([])
    onSelect(result)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onClear?.()
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[13px] font-semibold text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder || 'Adres aramak icin yazin...'}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
        )}
        {!isLoading && query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lng}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-orange-50 text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] text-slate-700 leading-snug truncate">{result.displayName}</p>
                {result.city && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {[result.district, result.city].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
