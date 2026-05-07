import api from './client'
import type { ApiResponse } from '../types'

export interface GeocodingResult {
  displayName: string
  lat: number
  lng: number
  city?: string
  district?: string
  street?: string
  postcode?: string
}

export interface ReverseGeocodingResult {
  displayName: string
  address?: string
  city?: string
  district?: string
  street?: string
  postcode?: string
}

export const geocodingApi = {
  search: (query: string) =>
    api.get<ApiResponse<GeocodingResult[]>>('/geocoding/search', { params: { query } }).then(r => r.data),

  reverse: (lat: number, lng: number) =>
    api.get<ApiResponse<ReverseGeocodingResult>>('/geocoding/reverse', { params: { lat, lng } }).then(r => r.data),
}
