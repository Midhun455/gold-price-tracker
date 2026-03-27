import { NextResponse } from 'next/server'

// TradingView scanner endpoint for forex/commodities
async function fetchTradingView(symbol) {
  try {
    const res = await fetch("https://scanner.tradingview.com/forex/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbols: {
          tickers: [symbol],
          query: { types: [] },
        },
        columns: ["close"], // current price
      }),
      next: { revalidate: 2 }
    })

    if (!res.ok) {
      throw new Error(`TradingView HTTP ${res.status}`)
    }

    const data = await res.json()
    
    // Extract price from response
    if (data && data.data && data.data[0] && data.data[0].d && data.data[0].d[0]) {
      const price = data.data[0].d[0]
      return typeof price === 'number' && !isNaN(price) ? price : null
    }
    
    return null
  } catch (err) {
    console.error("TradingView fetch failed for", symbol, ":", err.message)
    return null
  }
}

// Yahoo Finance fallback
async function fetchYahooFinance(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/charts/${symbol}`, {
      next: { revalidate: 2 }
    })
    
    if (!res.ok) return null
    
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    
    return price && !isNaN(price) ? price : null
  } catch (err) {
    console.error("Yahoo Finance fetch failed for", symbol, ":", err.message)
    return null
  }
}

// USD/INR rate with multiple sources
async function fetchUSDINR() {
  const sources = [
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 60 }
      })
      const data = await res.json()
      return data?.rates?.INR
    },
    async () => {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/charts/USDINR=X')
      const data = await res.json()
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice
    }
  ]
  
  for (const source of sources) {
    try {
      const rate = await source()
      if (rate && !isNaN(rate) && rate > 0) return rate
    } catch (e) {
      continue
    }
  }
  
  return 86.5 // Fallback rate
}

export async function GET() {
  try {
    // Fetch USD/INR
    const usdInr = await fetchUSDINR()
    
    // Try TradingView first for both metals
    let goldUSD = await fetchTradingView("OANDA:XAUUSD")
    let silverUSD = await fetchTradingView("OANDA:XAGUSD")
    
    // Fallback to Yahoo Finance if TradingView fails
    if (!goldUSD) {
      console.log("Falling back to Yahoo Finance for Gold")
      goldUSD = await fetchYahooFinance("GC=F")
    }
    
    if (!silverUSD) {
      console.log("Falling back to Yahoo Finance for Silver")
      silverUSD = await fetchYahooFinance("SI=F")
    }
    
    // If both fail, use realistic demo values
    if (!goldUSD) goldUSD = 2350.50
    if (!silverUSD) silverUSD = 28.75
    
    const OZ_TO_GRAM = 31.1035
    
    // Calculate INR per gram
    const goldINRPerGram = (goldUSD / OZ_TO_GRAM) * usdInr
    const silverINRPerGram = (silverUSD / OZ_TO_GRAM) * usdInr
    
    return NextResponse.json({
      success: true,
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
    
    // Return fallback data
    const fallbackUsdInr = 86.5
    const fallbackGoldUsd = 2350.50
    const fallbackSilverUsd = 28.75
    const OZ_TO_GRAM = 31.1035
    
    return NextResponse.json({
      success: false,
      gold: {
        usd: fallbackGoldUsd,
        inr: (fallbackGoldUsd / OZ_TO_GRAM) * fallbackUsdInr,
        usdInr: fallbackUsdInr
      },
      silver: {
        usd: fallbackSilverUsd,
        inr: (fallbackSilverUsd / OZ_TO_GRAM) * fallbackUsdInr,
        usdInr: fallbackUsdInr
      },
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}
