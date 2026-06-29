import { useState, useEffect } from 'react'
import { Save, MapPin, Search } from 'lucide-react'
import LocationPicker from '../../components/map/LocationPicker'
import { toast } from '../../components/ui/Toast'

const STORAGE_KEY = 'klc_depot_location'

interface DepotLocation {
  lat: number
  lng: number
  address: string
}

export default function DepotPage() {
  const [depot, setDepot] = useState<DepotLocation>({
    lat: 39.925,
    lng: 32.837,
    address: 'Ankara, Turkiye',
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DepotLocation
        setDepot(parsed)
      } catch {
        // ignore invalid data
      }
    }
  }, [])

  const handleLocationChange = (lat: number, lng: number, address?: { displayName: string }) => {
    setDepot({
      lat,
      lng,
      address: address?.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    })
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    // Basic geocoding search via Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`)
      .then(r => r.json())
      .then((results: Array<{ lat: string; lon: string; display_name: string }>) => {
        if (results.length > 0) {
          const r = results[0]
          setDepot({
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            address: r.display_name,
          })
        } else {
          toast('error', 'Adres bulunamadi')
        }
      })
      .catch(() => {
        toast('error', 'Arama sirasinda hata olustu')
      })
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(depot))
    toast('success', 'Depo konumu kaydedildi')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Depo / Ana Konum</h1>
        <p className="text-[14px] text-slate-400 mt-1">Rota optimizasyonu icin baslangic noktasi</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Adres ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
          </div>
          <button onClick={handleSearch} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
            Ara
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-orange-500" />
          <h3 className="text-[15px] font-semibold text-slate-800">Depo Konumu</h3>
        </div>

        <LocationPicker
          lat={depot.lat}
          lng={depot.lng}
          onLocationChange={handleLocationChange}
          height={400}
        />

        {/* Address display */}
        {depot.address && (
          <p className="text-[13px] text-slate-600 mt-3 bg-slate-50 rounded-lg px-4 py-2">
            {depot.address}
          </p>
        )}

        {/* Lat/Lng Inputs */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Enlem (Latitude)</label>
            <input
              type="number"
              step="0.00001"
              value={depot.lat}
              onChange={(e) => setDepot(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Boylam (Longitude)</label>
            <input
              type="number"
              step="0.00001"
              value={depot.lng}
              onChange={(e) => setDepot(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Save className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </div>
  )
}
