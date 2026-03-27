import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function fetchRealtimePrice(symbol) {
  // TradingView's real-time data via their unofficial API
  const tvUrl = `https://price.tradingview.com/price?symbol=${symbol}`
  
  try {
    const response = await fetch(tvUrl, {
      headers: {
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/'
      }
    })
    const data = await response.json()
    return data.price
  } catch (error) {
    console.error('TradingView real-time error:', error)
    return null
  }
}

export async function GET(request) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId
    
      const updatePrices = async () => {
        try {
          const [goldUSD, silverUSD, usdInr] = await Promise.all([
            fetchRealtimePrice('FX_IDC:XAUUSD'),
            fetchRealtimePrice('FX_IDC:XAGUSD'),
            fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r => r.json()).then(d => d.rates.INR)
          ])
          
          const OZ_TO_GRAM = 31.1035
          const goldINRPerGram = (goldUSD / OZ_TO_GRAM) * usdInr
          const silverINRPerGram = (silverUSD / OZ_TO_GRAM) * usdInr
          
          const data = {
            gold: { usd: goldUSD, inr: goldINRPerGram },
            silver: { usd: silverUSD, inr: silverINRPerGram },
            usdInr: usdInr,
            timestamp: new Date().toISOString()
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error('Stream error:', error)
        }
      }
      
      // Send update every 2 seconds
      intervalId = setInterval(updatePrices, 2000)
      await updatePrices()
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
