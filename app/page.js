'use client'

import { useState, useEffect, useRef } from 'react'
import PriceCard from '../components/PriceCard'
import { calculateGoldRates, calculateSilverRates, getPriceChange } from '../lib/priceFetcher'

export default function Home() {
  const [prices, setPrices] = useState({
    gold: { usd: null, inr: null, usdInr: null, rates: null, lastUpdate: null, source: null },
    silver: { usd: null, inr: null, usdInr: null, ratePerGram: null, perKg: null, lastUpdate: null, source: null }
  })
  const [previousPrices, setPreviousPrices] = useState({ gold: null, silver: null })
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/prices')
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      
      // Store previous prices for change calculation
      setPreviousPrices({
        gold: prices.gold.inr,
        silver: prices.silver.ratePerGram
      })
      
      const goldRates = calculateGoldRates(data.gold.inr)
      const silverRates = calculateSilverRates(data.silver.inr)
      
      setPrices({
        gold: {
          usd: data.gold.usd.toFixed(2),
          inr: data.gold.inr.toFixed(2),
          usdInr: data.gold.usdInr.toFixed(2),
          rates: goldRates,
          source: data.gold.source,
          lastUpdate: new Date().toLocaleTimeString()
        },
        silver: {
          usd: data.silver.usd.toFixed(2),
          inr: data.silver.inr.toFixed(2),
          usdInr: data.silver.usdInr.toFixed(2),
          ratePerGram: silverRates.perGram,
          perKg: silverRates.perKg,
          source: data.silver.source,
          lastUpdate: new Date().toLocaleTimeString()
        }
      })
      
      setLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error fetching prices:', error)
      setError('Failed to fetch prices. Using fallback data...')
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 2000)
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
          <p className="text-white">Fetching live rates from TradingView...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 glass p-4 rounded-lg text-yellow-400 z-50">
          ⚠️ {error}
        </div>
      )}
      
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div 
          className={`relative transition-transform duration-700`}
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
