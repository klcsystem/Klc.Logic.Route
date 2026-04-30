import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

const VEHICLE_TYPES = [
  { value: 'TIR', label: 'Tir' },
  { value: 'TRUCK', label: 'Kamyon' },
  { value: 'DUMPER_TRUCK', label: 'Damperli Kamyon' },
  { value: 'REEFER_TRUCK', label: 'Frigorifik' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'LOWBED', label: 'Lowbed' },
  { value: 'CURTAINSIDER', label: 'Tenteli' },
  { value: 'LIGHT_TRUCK_3500', label: 'Kamyonet 3.5t' },
]

const BODY_TYPES = [
  { value: 'SHORT_TRAILER', label: 'Kisa Dorse' },
  { value: 'LONG_TRAILER', label: 'Uzun Dorse' },
  { value: 'MEGA_TRAILER', label: 'Mega Dorse' },
]

const PACKAGE_TYPES = [
  { value: 'PALLET', label: 'Palet' },
  { value: 'BOX', label: 'Kutu' },
  { value: 'BULK', label: 'Dokme' },
  { value: 'BARREL', label: 'Varil' },
  { value: 'BAG', label: 'Torba' },
]

const WAY_OF_LOADING = [
  { value: 'FORKLIFT_FROM_THE_SIDE', label: 'Forklift (Yandan)' },
  { value: 'FORKLIFT_FROM_BEHIND', label: 'Forklift (Arkadan)' },
  { value: 'CRANE', label: 'Vinc' },
  { value: 'MANUAL', label: 'Manuel' },
  { value: 'PUMPING', label: 'Pompa' },
]

const ADDRESS_TYPES = [
  { value: 'FACTORY', label: 'Fabrika' },
  { value: 'WAREHOUSE', label: 'Depo' },
  { value: 'WORKSPACE', label: 'Isyeri' },
  { value: 'MALL', label: 'AVM' },
]

const TEMPERATURE_TYPES = [
  { value: 'DRY', label: 'Kuru' },
  { value: 'COLD', label: 'Soguk' },
  { value: 'FROZEN', label: 'Dondurulmus' },
]

interface AddressForm {
  company: string
  name: string
  familyName: string
  phoneNumber: string
  city: string
  district: string
  address: string
  latitude: string
  longitude: string
  addressType: string
}

const emptyAddress: AddressForm = {
  company: '', name: '', familyName: '', phoneNumber: '', city: '', district: '', address: '', latitude: '', longitude: '', addressType: 'FACTORY',
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-600 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-600 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function AddressSection({ title, data, onChange, color }: {
  title: string; data: AddressForm; onChange: (d: AddressForm) => void; color: string
}) {
  const set = (key: keyof AddressForm, val: string) => onChange({ ...data, [key]: val })
  return (
    <div className={`p-5 rounded-2xl border ${color}`}>
      <h3 className="text-[14px] font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Firma" value={data.company} onChange={v => set('company', v)} required />
        <InputField label="Ad" value={data.name} onChange={v => set('name', v)} required />
        <InputField label="Soyad" value={data.familyName} onChange={v => set('familyName', v)} />
        <InputField label="Telefon" value={data.phoneNumber} onChange={v => set('phoneNumber', v)} required placeholder="+905xx..." />
        <InputField label="Sehir" value={data.city} onChange={v => set('city', v)} required />
        <InputField label="Ilce" value={data.district} onChange={v => set('district', v)} />
        <div className="col-span-2">
          <InputField label="Adres" value={data.address} onChange={v => set('address', v)} required />
        </div>
        <InputField label="Enlem" value={data.latitude} onChange={v => set('latitude', v)} type="number" placeholder="40.7988" />
        <InputField label="Boylam" value={data.longitude} onChange={v => set('longitude', v)} type="number" placeholder="29.4314" />
        <SelectField label="Adres Tipi" value={data.addressType} onChange={v => set('addressType', v)} options={ADDRESS_TYPES} />
      </div>
    </div>
  )
}

export default function YoldaShipmentCreate() {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState<AddressForm>(emptyAddress)
  const [dropoff, setDropoff] = useState<AddressForm>(emptyAddress)
  const [shipmentType, setShipmentType] = useState('FTL')
  const [totalKg, setTotalKg] = useState('')
  const [totalDs, setTotalDs] = useState('')
  const [vehicleType, setVehicleType] = useState('TIR')
  const [bodyType, setBodyType] = useState('LONG_TRAILER')
  const [tonnagePerVehicle, setTonnagePerVehicle] = useState('24')
  const [numberOfVehicles, setNumberOfVehicles] = useState('1')
  const [packageType, setPackageType] = useState('PALLET')
  const [wayOfLoading, setWayOfLoading] = useState('FORKLIFT_FROM_BEHIND')
  const [wayOfUnloading, setWayOfUnloading] = useState('FORKLIFT_FROM_BEHIND')
  const [pricingType, setPricingType] = useState('FIXED')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [deliveryType, setDeliveryType] = useState('STANDARD')
  const [temperatureType, setTemperatureType] = useState('DRY')
  const [isRoundTrip, setIsRoundTrip] = useState(false)
  const [pickupStartDate, setPickupStartDate] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    // In production, this would call yoldaApi.createShipment(...)
    setTimeout(() => {
      setSubmitting(false)
      navigate('/yolda')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/yolda')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Yeni Yolda Sevkiyati</h1>
          <p className="text-[14px] text-slate-400 mt-1">Yolda API uzerinden yeni sevkiyat olusturun</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pickup */}
        <AddressSection title="Gonderici (Yuklenme Noktasi)" data={pickup} onChange={setPickup} color="bg-green-50/50 border-green-200" />

        {/* Dropoff */}
        <AddressSection title="Alici (Teslimat Noktasi)" data={dropoff} onChange={setDropoff} color="bg-blue-50/50 border-blue-200" />
      </div>

      {/* Cargo Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[14px] font-semibold text-slate-800 mb-4">Yuk Bilgisi</h3>
        <div className="grid grid-cols-3 gap-4">
          <SelectField label="Sevkiyat Tipi" value={shipmentType} onChange={setShipmentType} options={[{ value: 'FTL', label: 'FTL (Komple Yuk)' }, { value: 'LTL', label: 'LTL (Parsiyel)' }]} required />
          <InputField label="Agirlik (kg)" value={totalKg} onChange={setTotalKg} type="number" required placeholder="22000" />
          <InputField label="Desi" value={totalDs} onChange={setTotalDs} type="number" placeholder="45" />
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[14px] font-semibold text-slate-800 mb-4">Arac Bilgisi</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField label="Arac Tipi" value={vehicleType} onChange={setVehicleType} options={VEHICLE_TYPES} required />
          <SelectField label="Kasa Tipi" value={bodyType} onChange={setBodyType} options={BODY_TYPES} />
          <InputField label="Tonaj/Arac" value={tonnagePerVehicle} onChange={setTonnagePerVehicle} type="number" />
          <InputField label="Arac Sayisi" value={numberOfVehicles} onChange={setNumberOfVehicles} type="number" />
          <SelectField label="Ambalaj Tipi" value={packageType} onChange={setPackageType} options={PACKAGE_TYPES} />
          <SelectField label="Yukleme Sekli" value={wayOfLoading} onChange={setWayOfLoading} options={WAY_OF_LOADING} />
          <SelectField label="Bosaltma Sekli" value={wayOfUnloading} onChange={setWayOfUnloading} options={WAY_OF_LOADING} />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[14px] font-semibold text-slate-800 mb-4">Fiyat Bilgisi</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField label="Fiyatlandirma Tipi" value={pricingType} onChange={setPricingType} options={[{ value: 'FIXED', label: 'Sabit Fiyat' }, { value: 'AUCTION', label: 'Ihale' }]} required />
          <InputField label="Fiyat" value={price} onChange={setPrice} type="number" placeholder="14500" />
          <SelectField label="Para Birimi" value={currency} onChange={setCurrency} options={[{ value: 'TRY', label: 'TRY' }, { value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }]} />
          <SelectField label="Teslimat Tipi" value={deliveryType} onChange={setDeliveryType} options={[{ value: 'STANDARD', label: 'Standart' }, { value: 'EXPRESS', label: 'Ekspres' }]} />
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[14px] font-semibold text-slate-800 mb-4">Ek Bilgiler</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField label="Sicaklik Tipi" value={temperatureType} onChange={setTemperatureType} options={TEMPERATURE_TYPES} />
          <InputField label="Yuklenme Tarihi" value={pickupStartDate} onChange={setPickupStartDate} type="datetime-local" />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRoundTrip}
                onChange={e => setIsRoundTrip(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="text-[13px] text-slate-700">Gidis-Donus</span>
            </label>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[12px] font-medium text-slate-600 mb-1">Not</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all resize-none"
            placeholder="Sevkiyat ile ilgili ek notlar..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => navigate('/yolda')}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Iptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Gonderiliyor...' : 'Sevkiyat Olustur'}
        </button>
      </div>
    </div>
  )
}
