'use client'

import { useState, useEffect } from 'react'
import PriceCard from '@/components/PriceCard'
import { calculateGoldRates, calculateSilverRates } from '@/lib/priceFetcher'

export default function Home() {
  const [prices, setPrices] = useState({
    gold: { usd: null, inr: null, usdInr: null, rates: null, lastUpdate: null },
    silver: { usd: null, inr: null, usdInr: null, ratePerGram: null, perKg: null, lastUpdate: null }
  })
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/prices')
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      
      const goldRates = calculateGoldRates(data.gold.inr)
      const silverRates = calculateSilverRates(data.silver.inr)
      
      setPrices({
        gold: {
          usd: data.gold.usd.toFixed(2),
          inr: data.gold.inr.toFixed(2),
          usdInr: data.gold.usdInr.toFixed(2),
          rates: goldRates,
          lastUpdate: new Date().toLocaleTimeString()
        },
        silver: {
          usd: data.silver.usd.toFixed(2),
          inr: data.silver.inr.toFixed(2),
          usdInr: data.silver.usdInr.toFixed(2),
          ratePerGram: silverRates.perGram,
          perKg: silverRates.perKg,
          lastUpdate: new Date().toLocaleTimeString()
        }
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
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
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div 
          className={`relative transition-transform duration-700 transform-gpu`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div style={{ backfaceVisibility: 'hidden' }}>
            <PriceCard
              title="Gold Price Tracker"
              icon="🥇"
              type="gold"
              data={prices.gold}
              onToggle={handleToggle}
              isFlipped={isFlipped}
            />
          </div>
          
          {/* Back */}
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
              onToggle={handleToggle}
              isFlipped={isFlipped}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
