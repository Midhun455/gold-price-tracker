import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch gold price
    const goldRes = await fetch('https://api.gold-api.com/price/XAU', {
      headers: {
        'x-access-token': process.env.GOLD_API_KEY,
      },
      next: { revalidate: 2 } // Cache for 2 seconds
    })
    
    // Fetch silver price from Yahoo Finance (free, no API key needed)
    const silverRes = await fetch('https://query1.finance.yahoo.com/v8/finance/charts/SI=F', {
      next: { revalidate: 2 }
    })
    
    // Fetch USD/INR rate
    const forexRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 60 }
    })
    
    if (!goldRes.ok || !silverRes.ok) {
      throw new Error('Failed to fetch prices')
    }
    
    const goldData = await goldRes.json()
    const silverData = await silverRes.json()
    const forexData = await forexRes.json()
    
    // Calculate rates
    const OZ_TO_GRAM = 31.1035
    const usdInr = forexData.rates.INR
    
    const goldUSD = goldData.price
    const goldUSDPerGram = goldUSD / OZ_TO_GRAM
    const goldINRPerGram = goldUSDPerGram * usdInr
    
    const silverUSD = silverData.chart.result[0].meta.regularMarketPrice
    const silverUSDPerGram = silverUSD / OZ_TO_GRAM
    const silverINRPerGram = silverUSDPerGram * usdInr
    
    return NextResponse.json({
      gold: {
        usd: goldUSD,
        inr: goldINRPerGram,
        usdInr: usdInr
      },
      silver: {
        usd: silverUSD,
        inr: silverINRPerGram,
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
