import axios from 'axios'

const isProduction = window.location.hostname !== 'localhost'
const API_URL = import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:1641/api')

const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export interface TrackingData {
  shipmentId: string
  shipmentNumber: string
  status: 'OrderReceived' | 'Loaded' | 'InTransit' | 'Delivered'
  origin: { city: string; address: string; lat: number; lng: number }
  destination: { city: string; address: string; lat: number; lng: number }
  driverLocation: { lat: number; lng: number } | null
  eta: string | null
  etaFormatted: string | null
  sender: { name: string; phone?: string }
  receiver: { name: string; phone?: string; address: string }
  events: { status: string; description: string; timestamp: string }[]
  companyName: string
  companyLogo?: string
}

export const publicTrackingApi = {
  getByToken: (token: string) =>
    publicApi.get<{ data: TrackingData; success: boolean }>(`/public/tracking/${token}`).then(r => r.data),
}
