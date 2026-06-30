import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MarketIntelligencePage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/reports', { replace: true })
  }, [navigate])

  return null
}
