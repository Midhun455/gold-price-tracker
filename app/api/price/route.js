import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch USD/INR rate (free API)
    const forexRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const forexData = await forexRes.json()
    const usdInr = forexData.rates.INR
    
    // Using Yahoo Finance for gold and silver (free, no API key needed)
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/charts/GC=F'),
      fetch('https://query1.finance.yahoo.com/v8/finance/charts/SI=F')
    ])
    
    const goldData = await goldRes.json()
    const silverData = await silverRes.json()
    
    const goldUSD = goldData.chart.result[0].meta.regularMarketPrice
    const silverUSD = silverData.chart.result[0].meta.regularMarketPrice
    
    const OZ_TO_GRAM = 31.1035
    
    return NextResponse.json({
      gold: {
        usd: goldUSD,
        inr: (goldUSD / OZ_TO_GRAM) * usdInr,
        usdInr: usdInr
      },
      silver: {
        usd: silverUSD,
        inr: (silverUSD / OZ_TO_GRAM) * usdInr,
        usdInr: usdInr
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
