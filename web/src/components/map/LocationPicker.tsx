import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair } from 'lucide-react'
import { geocodingApi, type ReverseGeocodingResult } from '../../api/geocoding'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f97316;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
    <div style="background:white;width:8px;height:8px;border-radius:50%;transform:rotate(45deg)"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

interface LocationPickerProps {
  lat?: number
  lng?: number
  onLocationChange: (lat: number, lng: number, address?: ReverseGeocodingResult) => void
  height?: number
}

function MapClickHandler({ onLocationChange }: { onLocationChange: LocationPickerProps['onLocationChange'] }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      try {
        const response = await geocodingApi.reverse(lat, lng)
        if (response.success && response.data) {
          onLocationChange(lat, lng, response.data)
        } else {
          onLocationChange(lat, lng)
        }
      } catch {
        onLocationChange(lat, lng)
      }
    },
  })
  return null
}

function FlyToPosition({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef<string>('')

  useEffect(() => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
    if (key !== prevRef.current) {
      prevRef.current = key
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 })
    }
  }, [lat, lng, map])

  return null
}

export default function LocationPicker({ lat, lng, onLocationChange, height = 280 }: LocationPickerProps) {
  const [isReverseLoading, setIsReverseLoading] = useState(false)

  const defaultCenter: [number, number] = [39.925, 32.837] // Ankara
  const center: [number, number] = lat && lng ? [lat, lng] : defaultCenter
  const zoom = lat && lng ? 14 : 6

  const handleClick = async (clickLat: number, clickLng: number, address?: ReverseGeocodingResult) => {
    if (address) {
      onLocationChange(clickLat, clickLng, address)
      return
    }
    setIsReverseLoading(true)
    try {
      const response = await geocodingApi.reverse(clickLat, clickLng)
      if (response.success && response.data) {
        onLocationChange(clickLat, clickLng, response.data)
      } else {
        onLocationChange(clickLat, clickLng)
      }
    } catch {
      onLocationChange(clickLat, clickLng)
    } finally {
      setIsReverseLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height, width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationChange={handleClick} />
          {lat && lng && (
            <>
              <Marker position={[lat, lng]} icon={pinIcon} />
              <FlyToPosition lat={lat} lng={lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordinate display */}
      {lat && lng && (
        <div className="flex items-center gap-1.5 mt-2">
          <Crosshair className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
          {isReverseLoading && <span className="text-[11px] text-orange-400">Adres yukleniyor...</span>}
        </div>
      )}

      {!lat && !lng && (
        <p className="text-[11px] text-slate-400 mt-2">Haritaya tiklayarak konum secin</p>
      )}
    </div>
  )
}
