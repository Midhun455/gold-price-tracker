'use client'

import { useState, useEffect } from 'react'
import PriceCard from '../components/PriceCard'
import { calculateGoldRates, calculateSilverRates, getPriceChange } from '../lib/priceFetcher'

export default function Home() {
  const [prices, setPrices] = useState({
    gold: {
      usd: null,
      inr: null,
      usdInr: null,
      rates: null,
      lastUpdate: null,
      source: null
    },
    silver: {
      usd: null,
      inr: null,
      usdInr: null,
      ratePerGram: null,
      perKg: null,
      lastUpdate: null,
      source: null
    }
  })

  const [previousPrices, setPreviousPrices] = useState({ gold: null, silver: null })
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/price', { cache: 'no-store' })
      const data = await response.json()

      const goldInr = Number(data?.gold?.inr ?? data?.gold?.inrPerGram ?? 0)
      const silverInr = Number(data?.silver?.inr ?? data?.silver?.inrPerGram ?? 0)
      const goldUsd = Number(data?.gold?.usd ?? 0)
      const silverUsd = Number(data?.silver?.usd ?? 0)
      const usdInr = Number(data?.gold?.usdInr ?? data?.silver?.usdInr ?? 0)

      if (!goldInr || !silverInr) {
        throw new Error('Invalid price data received from API')
      }

      setPreviousPrices({
        gold: prices.gold.inr ? Number(prices.gold.inr) : null,
        silver: prices.silver.ratePerGram ? Number(prices.silver.ratePerGram) : null
      })

      const goldRates = calculateGoldRates(goldInr)
      const silverRates = calculateSilverRates(silverInr)

      setPrices({
        gold: {
          usd: goldUsd.toFixed(2),
          inr: goldInr.toFixed(2),
          usdInr: usdInr.toFixed(2),
          rates: goldRates,
          source: data?.gold?.source || 'API',
          lastUpdate: new Date().toLocaleTimeString()
        },
        silver: {
          usd: silverUsd.toFixed(2),
          inr: silverInr.toFixed(2),
          usdInr: usdInr.toFixed(2),
          ratePerGram: Number(silverRates.perGram).toFixed(2),
          perKg: Number(silverRates.perKg).toFixed(2),
          source: data?.silver?.source || 'API',
          lastUpdate: new Date().toLocaleTimeString()
        }
      })

      setError(null)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      setError('Failed to fetch prices')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = () => {
    setIsFlipped(!isFlipped)
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 glass p-4 rounded-lg text-yellow-400 z-50">
          {error}
        </div>
      )}

      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div
          className="relative transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            <PriceCard
              title="Gold Price Tracker"
              icon="🥇"
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
              width: '100%'
            }}
          >
            <PriceCard
              title="Silver Price Tracker"
              icon="🥈"
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
