import api from './client'

export interface YoldaShipmentCreate {
  pickup: {
    company: string
    name: string
    familyName?: string
    phoneNumber: string
    city: string
    district?: string
    address: string
    latitude?: number
    longitude?: number
    addressType: string
    countryId?: string
  }
  dropoff: {
    company: string
    name: string
    familyName?: string
    phoneNumber: string
    city: string
    district?: string
    address: string
    latitude?: number
    longitude?: number
    addressType: string
    countryId?: string
  }
  shipmentType: string
  totalKg: number
  totalDs: number
  vehicle: {
    type: string
    bodyType?: string
    tonnagePerVehicle?: number
    numberOfVehicles?: number
    packageType?: string
    wayOfLoading?: string
    wayOfUnloading?: string
  }
  pricing: {
    type: string
    price?: number
    currency?: string
    deliveryType?: string
    targetCost?: number
  }
  temperatureType?: string
  isRoundTrip?: boolean
  pickupStartDate?: string
  note?: string
}

export interface YoldaContactCreate {
  company: string
  name: string
  familyName?: string
  phoneNumber: string
  addressType: string
  city: string
  district?: string
  address: string
  countryId?: string
  latitude?: number
  longitude?: number
}

export interface YoldaShipment {
  id: string
  pickup: {
    company: string
    name: string
    familyName?: string
    phoneNumber: string
    city: string
    district?: string
    address: string
    latitude?: number
    longitude?: number
    addressType: string
  }
  dropoff: {
    company: string
    name: string
    familyName?: string
    phoneNumber: string
    city: string
    district?: string
    address: string
    latitude?: number
    longitude?: number
    addressType: string
  }
  shipmentType: string
  totalKg: number
  totalDs: number
  routeTotalDistanceInKm?: number
  temperatureType?: string
  isRoundTrip?: boolean
  estimatedDeliveryDate?: string
  pickupStartDate?: string
  status: { type: string; date: string }[]
  vehicle: {
    type: string
    bodyType?: string
    tonnagePerVehicle?: number
    numberOfVehicles?: number
    packageType?: string
    wayOfLoading?: string
    wayOfUnloading?: string
  }
  pricing: {
    type: string
    price?: number
    tax?: number
    total?: number
    currency?: string
    deliveryType?: string
    targetCost?: number
  }
  note?: string
}

export interface YoldaContact {
  id: string
  company: string
  name: string
  familyName?: string
  phoneNumber: string
  addressType: string
  city: string
  district?: string
  address: string
  countryId?: string
  latitude?: number
  longitude?: number
}

export const yoldaApi = {
  getShipments: (page = 1, size = 20) =>
    api.get(`/yolda/shipments`, { params: { page, size } }).then(r => r.data),

  getShipment: (id: string) =>
    api.get(`/yolda/shipments/${id}`).then(r => r.data),

  createShipment: (data: YoldaShipmentCreate) =>
    api.post('/yolda/shipments', data).then(r => r.data),

  getContacts: (page = 1, size = 20) =>
    api.get(`/yolda/contacts`, { params: { page, size } }).then(r => r.data),

  createContact: (data: YoldaContactCreate) =>
    api.post('/yolda/contacts', data).then(r => r.data),

  testConnection: () =>
    api.get('/yolda/test').then(r => r.data),
}
