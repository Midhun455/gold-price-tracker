import { NextResponse } from 'next/server'

const OZ_TO_GRAM = 31.1034768
const FALLBACK_USD_INR = 86.5
const FALLBACK_GOLD_USD = 2650
const FALLBACK_SILVER_USD = 32.5

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function fetchTradingView(symbol) {
  try {
    const res = await fetch('https://scanner.tradingview.com/cfd/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        symbols: {
          tickers: [symbol],
          query: { types: [] },
        },
        columns: ['close'],
        range: [0, 0],
      }),
      next: { revalidate: 10 },
    })

    if (!res.ok) return null

    const data = await safeJson(res)
    const price = data?.data?.[0]?.d?.[0]

    return typeof price === 'number' && Number.isFinite(price) ? price : null
  } catch (error) {
    console.error(`TradingView failed for ${symbol}:`, error)
    return null
  }
}

async function fetchYahooFinance(symbol) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 15 },
      }
    )

    if (!res.ok) return null

    const data = await safeJson(res)
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice

    return typeof price === 'number' && Number.isFinite(price) ? price : null
  } catch (error) {
    console.error(`Yahoo failed for ${symbol}:`, error)
    return null
  }
}

async function fetchUSDINR() {
  const sources = [
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 120 },
      })
      if (!res.ok) return null
      const data = await safeJson(res)
      return data?.rates?.INR
    },
    async () => {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          next: { revalidate: 60 },
        }
      )
      if (!res.ok) return null
      const data = await safeJson(res)
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice
    },
  ]

  for (const source of sources) {
    try {
      const rate = await source()
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        return rate
      }
    } catch {
      // Try the next source.
    }
  }

  return FALLBACK_USD_INR
}

export async function GET() {
  try {
    const usdInr = await fetchUSDINR()

    let goldUSD = null
    let silverUSD = null
    let goldSource = 'Fallback'
    let silverSource = 'Fallback'

    goldUSD = await fetchTradingView('TVC:XAUUSD')
    if (!goldUSD) goldUSD = await fetchTradingView('OANDA:XAUUSD')
    if (goldUSD) {
      goldSource = 'TradingView'
    } else {
      goldUSD = await fetchYahooFinance('GC=F')
      if (goldUSD) goldSource = 'Yahoo'
    }

    silverUSD = await fetchTradingView('TVC:XAGUSD')
    if (!silverUSD) silverUSD = await fetchTradingView('OANDA:XAGUSD')
    if (silverUSD) {
      silverSource = 'TradingView'
    } else {
      silverUSD = await fetchYahooFinance('SI=F')
      if (silverUSD) silverSource = 'Yahoo'
    }

    const finalGoldUSD =
      typeof goldUSD === 'number' && Number.isFinite(goldUSD) ? goldUSD : FALLBACK_GOLD_USD
    const finalSilverUSD =
      typeof silverUSD === 'number' && Number.isFinite(silverUSD) ? silverUSD : FALLBACK_SILVER_USD

    const goldINRPerGram = (finalGoldUSD / OZ_TO_GRAM) * usdInr
    const silverINRPerGram = (finalSilverUSD / OZ_TO_GRAM) * usdInr
    const isLiveGold = goldSource !== 'Fallback'
    const isLiveSilver = silverSource !== 'Fallback'
    const isLiveRate = usdInr !== FALLBACK_USD_INR
    const isFullyLive = isLiveGold && isLiveSilver && isLiveRate

    return NextResponse.json({
      success: isFullyLive,
      status: isFullyLive ? 'live' : 'partial-fallback',
      message: isFullyLive
        ? 'Live market data is available.'
        : 'Some providers were unavailable, so fallback values were used where needed.',
      gold: {
        usd: Number(finalGoldUSD.toFixed(2)),
        inrPerGram: Number(goldINRPerGram.toFixed(2)),
        usdInr: Number(usdInr.toFixed(2)),
        source: goldSource,
      },
      silver: {
        usd: Number(finalSilverUSD.toFixed(2)),
        inrPerGram: Number(silverINRPerGram.toFixed(4)),
        usdInr: Number(usdInr.toFixed(2)),
        source: silverSource,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Route Error:', error)

    return NextResponse.json({
      success: false,
      status: 'fallback',
      message: 'External price providers are unavailable. Showing fallback values.',
      gold: {
        usd: FALLBACK_GOLD_USD,
        inrPerGram: Number(((FALLBACK_GOLD_USD / OZ_TO_GRAM) * FALLBACK_USD_INR).toFixed(2)),
        usdInr: FALLBACK_USD_INR,
        source: 'Fallback',
      },
      silver: {
        usd: FALLBACK_SILVER_USD,
        inrPerGram: Number(((FALLBACK_SILVER_USD / OZ_TO_GRAM) * FALLBACK_USD_INR).toFixed(4)),
        usdInr: FALLBACK_USD_INR,
        source: 'Fallback',
      },
      timestamp: new Date().toISOString(),
      error: 'Using fallback data due to external API issues',
    })
  }
}
