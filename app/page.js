'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Home() {
  const [prices, setPrices] = useState({
    gold: { usd: null, inr: null, rates: { '24K': null, '22K': null, '18K': null } },
    silver: { usd: null, inr: null, ratePerGram: null }
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [activeMetal, setActiveMetal] = useState('gold') // 'gold' or 'silver'

  // Constants
  const OZ_TO_GRAM = 31.1035
  const USD_INR = 86.5 // Will be updated from API
  const DUTY_GOLD = 0.06 // 6% (5% BCD + 1% AIDC)
  const DUTY_SILVER = 0.06 // 6% (5% BCD + 1% AIDC)
  const MAKING_CHARGES = 0.08 // 8% making charges

  const fetchPrices = async () => {
    try {
      // Fetch gold price (XAU/USD)
      const goldRes = await fetch('https://api.gold-api.com/price/XAU', {
        headers: { 'x-access-token': 'YOUR_API_KEY' } // Get free key from gold-api.com
      })
      
      // Fallback to Yahoo Finance API
      const silverRes = await fetch('https://query1.finance.yahoo.com/v8/finance/charts/SI=F')
      const forexRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      
      // For demo, using mock data - replace with actual API calls
      // In production, use a proper API or your own backend
      
      // Mock data for demo (remove in production)
      const mockGoldUSD = 2350 + (Math.random() - 0.5) * 5
      const mockSilverUSD = 28.5 + (Math.random() - 0.5) * 0.3
      const mockUSDINR = 86.5 + (Math.random() - 0.5) * 0.1
      
      // Calculate gold prices in INR per gram
      const goldUSDPerGram = mockGoldUSD / OZ_TO_GRAM
      const goldINRPerGram = goldUSDPerGram * mockUSDINR
      const goldLanded = goldINRPerGram * (1 + DUTY_GOLD)
      
      // Calculate silver prices
      const silverUSDPerGram = mockSilverUSD / OZ_TO_GRAM
      const silverINRPerGram = silverUSDPerGram * mockUSDINR
      const silverLanded = silverINRPerGram * (1 + DUTY_SILVER)
      
      // Calculate different karats
      const karatRates = {
        '24K': goldLanded,
        '22K': goldLanded * (22/24),
        '18K': goldLanded * (18/24)
      }
      
      setPrices({
        gold: {
          usd: mockGoldUSD.toFixed(2),
          inr: goldLanded.toFixed(2),
          rates: karatRates,
          usdInr: mockUSDINR.toFixed(2)
        },
        silver: {
          usd: mockSilverUSD.toFixed(2),
          inr: silverLanded.toFixed(2),
          ratePerGram: silverLanded.toFixed(2),
          usdInr: mockUSDINR.toFixed(2)
        }
      })
      
      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 2000) // Update every 2 seconds
    return () => clearInterval(interval)
  }, [])

  const handleToggle = () => {
    setIsFlipped(!isFlipped)
    setTimeout(() => {
      setActiveMetal(isFlipped ? 'gold' : 'silver')
    }, 300)
  }

  const goldData = prices.gold
  const silverData = prices.silver

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl perspective-1000">
        {/* Flip Card Container */}
        <div 
          className={`relative transition-transform duration-700 transform-gpu preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front - Gold Card */}
          <div className={`backface-hidden glass-card p-8 w-full transition-all ${isFlipped ? 'hidden' : 'block'}`}>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold">🥇</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Gold Price Tracker</h2>
              <p className="text-gray-300 text-sm">24K · 22K · 18K India Import Landed</p>
            </div>

            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">XAU/USD</span>
                  <span className="text-white font-mono text-xl">${goldData.usd || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">USD/INR</span>
                  <span className="text-white font-mono text-xl">₹{goldData.usdInr || '—'}</span>
                </div>
              </div>

              <div className="glass p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">24K Gold</span>
                  <span className="text-yellow-400 font-bold text-xl">₹{goldData.rates?.['24K'] || '—'}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">22K Gold</span>
                  <span className="text-yellow-300 font-bold text-xl">₹{goldData.rates?.['22K'] || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">18K Gold</span>
                  <span className="text-yellow-200 font-bold text-xl">₹{goldData.rates?.['18K'] || '—'}</span>
                </div>
              </div>

              <div className="text-center text-gray-400 text-xs mt-4">
                <p>📊 Live updates every 2 seconds</p>
                <p className="mt-1">🔄 Last updated: {lastUpdate || '—'}</p>
                <p className="mt-2 text-gray-500">*Includes 6% duty + making charges</p>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className="mt-6 w-full glass py-3 rounded-xl text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span>🔄</span> Toggle Silver Rates
            </button>
          </div>

          {/* Back - Silver Card */}
          <div className={`backface-hidden glass-card p-8 w-full absolute top-0 left-0 rotate-y-180 ${isFlipped ? 'block' : 'hidden'}`}>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold">🥈</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Silver Price Tracker</h2>
              <p className="text-gray-300 text-sm">XAG/USD · India Import Landed</p>
            </div>

            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">XAG/USD</span>
                  <span className="text-white font-mono text-xl">${silverData.usd || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">USD/INR</span>
                  <span className="text-white font-mono text-xl">₹{silverData.usdInr || '—'}</span>
                </div>
              </div>

              <div className="glass p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">Silver Price</span>
                  <span className="text-gray-200 font-bold text-2xl">₹{silverData.ratePerGram || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>per gram</span>
                  <span>+ making charges</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">1 kg Bar</span>
                    <span className="text-white font-mono">₹{silverData.ratePerGram ? (silverData.ratePerGram * 1000).toFixed(0) : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-400 text-xs mt-4">
                <p>📊 Live updates every 2 seconds</p>
                <p className="mt-1">🔄 Last updated: {lastUpdate || '—'}</p>
                <p className="mt-2 text-gray-500">*Includes 6% duty + making charges</p>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className="mt-6 w-full glass py-3 rounded-xl text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span>🔄</span> Toggle Gold Rates
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  )
}
