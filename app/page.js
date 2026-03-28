'use client'

import { useEffect, useRef, useState } from 'react'
import PriceCard from '../components/PriceCard'
import { calculateGoldRates, calculateSilverRates, getPriceChange } from '../lib/priceFetcher'

function toFiniteNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '--'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '--'

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function Home() {
  const [prices, setPrices] = useState({
    gold: {
      usd: null,
      inr: null,
      usdInr: null,
      rates: null,
      lastUpdate: null,
      source: null,
    },
    silver: {
      usd: null,
      inr: null,
      usdInr: null,
      ratePerGram: null,
      perKg: null,
      lastUpdate: null,
      source: null,
    },
  })
  const [previousPrices, setPreviousPrices] = useState({ gold: null, silver: null })
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [error, setError] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)
  const latestPricesRef = useRef({
    gold: null,
    silver: null,
  })

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/price', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Price API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const goldInr = toFiniteNumber(data?.gold?.inrPerGram)
      const silverInr = toFiniteNumber(data?.silver?.inrPerGram)
      const goldUsd = toFiniteNumber(data?.gold?.usd)
      const silverUsd = toFiniteNumber(data?.silver?.usd)
      const usdInr = toFiniteNumber(data?.gold?.usdInr ?? data?.silver?.usdInr)

      if (goldInr === null || silverInr === null || goldUsd === null || silverUsd === null || usdInr === null) {
        throw new Error('Invalid price data received from API')
      }

      setPreviousPrices({
        gold: latestPricesRef.current.gold,
        silver: latestPricesRef.current.silver,
      })

      const goldRates = calculateGoldRates(goldInr)
      const silverRates = calculateSilverRates(silverInr)
      const nextPrices = {
        gold: {
          usd: goldUsd.toFixed(2),
          inr: goldInr.toFixed(2),
          usdInr: usdInr.toFixed(2),
          rates: goldRates,
          source: data?.gold?.source || 'API',
          lastUpdate: formatTimestamp(data?.timestamp),
        },
        silver: {
          usd: silverUsd.toFixed(2),
          inr: silverInr.toFixed(2),
          usdInr: usdInr.toFixed(2),
          ratePerGram: Number(silverRates.perGram).toFixed(2),
          perKg: Number(silverRates.perKg).toFixed(2),
          source: data?.silver?.source || 'API',
          lastUpdate: formatTimestamp(data?.timestamp),
        },
      }

      latestPricesRef.current = {
        gold: goldInr,
        silver: Number(silverRates.perGram),
      }
      setPrices(nextPrices)
      setStatusMessage(data?.status === 'live' ? null : data?.message || 'Showing fallback values.')
      setError(null)
    } catch (fetchError) {
      console.error('Error fetching prices:', fetchError)
      setError('Unable to refresh prices right now. Retrying automatically.')
      setStatusMessage(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = () => {
    setIsFlipped((currentValue) => !currentValue)
  }

  const goldChange = getPriceChange(prices.gold.inr, previousPrices.gold)
  const silverChange = getPriceChange(prices.silver.ratePerGram, previousPrices.silver)

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Fetching live rates...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {error && (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,40rem)] -translate-x-1/2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur">
          {error}
        </div>
      )}

      {statusMessage && !error && (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,40rem)] -translate-x-1/2 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100 backdrop-blur">
          {statusMessage}
        </div>
      )}

      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div
          className="relative transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            <PriceCard
              title="Gold Price Tracker"
              icon="Au"
              type="gold"
              data={prices.gold}
              change={goldChange}
              onToggle={handleToggle}
            />
          </div>

          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
          >
            <PriceCard
              title="Silver Price Tracker"
              icon="Ag"
              type="silver"
              data={prices.silver}
              change={silverChange}
              onToggle={handleToggle}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
