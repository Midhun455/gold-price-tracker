// app/api/price/route.js
import { NextResponse } from 'next/server';

async function fetchTradingView(symbol) {
  try {
    const res = await fetch("https://scanner.tradingview.com/cfd/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbols: {
          tickers: [symbol],
          query: { types: [] },
        },
        columns: ["close"],
        range: [0, 0],
      }),
      next: { revalidate: 8 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const price = data?.data?.[0]?.d?.[0];
    return typeof price === 'number' && !isNaN(price) ? price : null;
  } catch (err) {
    console.error(`TradingView failed for ${symbol}:`, err.message);
    return null;
  }
}

async function fetchYahooFinance(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/charts/${symbol}`, {
      next: { revalidate: 15 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && !isNaN(price) ? price : null;
  } catch (err) {
    console.error(`Yahoo failed for ${symbol}:`, err.message);
    return null;
  }
}

async function fetchUSDINR() {
  const sources = [
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 120 },
      });
      const data = await res.json();
      return data?.rates?.INR;
    },
    async () => {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/charts/USDINR=X', {
        next: { revalidate: 60 },
      });
      const data = await res.json();
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    },
  ];

  for (const source of sources) {
    try {
      const rate = await source();
      if (rate && !isNaN(rate) && rate > 80) return rate;
    } catch (e) {
      continue;
    }
  }
  console.warn("USD/INR sources failed → using fallback");
  return 86.5;
}

export async function GET() {
  try {
    const usdInr = await fetchUSDINR();

    let goldUSD = await fetchTradingView("TVC:XAUUSD") || 
                  await fetchTradingView("OANDA:XAUUSD");

    let silverUSD = await fetchTradingView("TVC:XAGUSD") || 
                    await fetchTradingView("OANDA:XAGUSD");

    // Yahoo fallback
    if (!goldUSD) {
      goldUSD = await fetchYahooFinance("GC=F");
    }
    if (!silverUSD) {
      silverUSD = await fetchYahooFinance("SI=F");
    }

    // Final safe fallbacks (updated 2026 realistic values)
    const finalGoldUSD = goldUSD && !isNaN(goldUSD) ? goldUSD : 2650;
    const finalSilverUSD = silverUSD && !isNaN(silverUSD) ? silverUSD : 32.5;

    const OZ_TO_GRAM = 31.1034768;

    const goldINRPerGram = (finalGoldUSD / OZ_TO_GRAM) * usdInr;
    const silverINRPerGram = (finalSilverUSD / OZ_TO_GRAM) * usdInr;

    return NextResponse.json({
      success: true,
      gold: {
        usd: Number(finalGoldUSD.toFixed(2)),
        inrPerGram: Number(goldINRPerGram.toFixed(2)),
        usdInr: Number(usdInr.toFixed(2)),
      },
      silver: {
        usd: Number(finalSilverUSD.toFixed(2)),
        inrPerGram: Number(silverINRPerGram.toFixed(4)),
        usdInr: Number(usdInr.toFixed(2)),
      },
      timestamp: new Date().toISOString(),
      source: goldUSD ? "TradingView" : "Fallback",
    });

  } catch (error) {
    console.error('API Route Error:', error);

    // Safe fallback response
    const fallbackUsdInr = 86.5;
    const fallbackGold = 2650;
    const fallbackSilver = 32.5;
    const OZ_TO_GRAM = 31.1034768;

    return NextResponse.json({
      success: false,
      gold: {
        usd: fallbackGold,
        inrPerGram: Number(((fallbackGold / OZ_TO_GRAM) * fallbackUsdInr).toFixed(2)),
        usdInr: fallbackUsdInr,
      },
      silver: {
        usd: fallbackSilver,
        inrPerGram: Number(((fallbackSilver / OZ_TO_GRAM) * fallbackUsdInr).toFixed(4)),
        usdInr: fallbackUsdInr,
      },
      timestamp: new Date().toISOString(),
      error: "Using fallback data due to external API issues",
    });
  }
}
