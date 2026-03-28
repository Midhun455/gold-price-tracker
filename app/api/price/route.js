// app/api/price/route.js
import { NextResponse } from 'next/server';

// Robust TradingView price fetch (CFD scanner)
async function fetchTradingView(symbol) {
  try {
    const res = await fetch("https://scanner.tradingview.com/cfd/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbols: {
          tickers: [symbol],
          query: { types: [] },
        },
        columns: ["close"],
        range: [0, 0],           // Get only the latest value
      }),
      next: { revalidate: 5 },   // Cache for 5 seconds
    });

    if (!res.ok) {
      throw new Error(`TradingView HTTP ${res.status}`);
    }

    const data = await res.json();

    // Extract price
    if (data?.data?.[0]?.d?.[0]) {
      const price = data.data[0].d[0];
      return typeof price === 'number' && !isNaN(price) ? price : null;
    }

    return null;
  } catch (err) {
    console.error(`TradingView fetch failed for ${symbol}:`, err.message);
    return null;
  }
}

// Yahoo Finance fallback
async function fetchYahooFinance(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/charts/${symbol}`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    return price && !isNaN(price) ? price : null;
  } catch (err) {
    console.error(`Yahoo Finance fetch failed for ${symbol}:`, err.message);
    return null;
  }
}

// USD/INR with multiple fallbacks
async function fetchUSDINR() {
  const sources = [
    // Frankfurter (best free forex rate)
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Frankfurter failed');
      const data = await res.json();
      return data?.rates?.INR;
    },
    // Yahoo Finance USDINR
    async () => {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/charts/USDINR=X', {
        next: { revalidate: 30 },
      });
      if (!res.ok) throw new Error('Yahoo INR failed');
      const data = await res.json();
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    },
  ];

  for (const source of sources) {
    try {
      const rate = await source();
      if (rate && !isNaN(rate) && rate > 0) return rate;
    } catch (e) {
      continue;
    }
  }

  console.warn("All USD/INR sources failed, using fallback");
  return 86.5; // Safe fallback
}

export async function GET() {
  try {
    const usdInr = await fetchUSDINR();

    // Try TradingView first (most reliable for spot prices)
    let goldUSD = await fetchTradingView("TVC:XAUUSD");
    let silverUSD = await fetchTradingView("TVC:XAGUSD");

    // Fallback to Yahoo Finance futures if needed
    if (!goldUSD) {
      console.log("Falling back to Yahoo for Gold");
      goldUSD = await fetchYahooFinance("GC=F");
    }

    if (!silverUSD) {
      console.log("Falling back to Yahoo for Silver");
      silverUSD = await fetchYahooFinance("SI=F");
    }

    // Final fallback values (realistic as of 2026)
    if (!goldUSD) goldUSD = 2350;
    if (!silverUSD) silverUSD = 29.5;

    const OZ_TO_GRAM = 31.1034768;

    const goldINRPerGram = (goldUSD / OZ_TO_GRAM) * usdInr;
    const silverINRPerGram = (silverUSD / OZ_TO_GRAM) * usdInr;

    return NextResponse.json({
      success: true,
      gold: {
        usd: Number(goldUSD.toFixed(2)),
        inrPerGram: Number(goldINRPerGram.toFixed(2)),
        usdInr: Number(usdInr.toFixed(2)),
      },
      silver: {
        usd: Number(silverUSD.toFixed(2)),
        inrPerGram: Number(silverINRPerGram.toFixed(4)),
        usdInr: Number(usdInr.toFixed(2)),
      },
      timestamp: new Date().toISOString(),
      source: goldUSD && silverUSD ? "TradingView" : "Mixed",
    });

  } catch (error) {
    console.error('API Error:', error);

    // Fallback response
    const fallbackUsdInr = 86.5;
    const fallbackGoldUsd = 2350;
    const fallbackSilverUsd = 29.5;
    const OZ_TO_GRAM = 31.1034768;

    return NextResponse.json({
      success: false,
      gold: {
        usd: fallbackGoldUsd,
        inrPerGram: Number(((fallbackGoldUsd / OZ_TO_GRAM) * fallbackUsdInr).toFixed(2)),
        usdInr: fallbackUsdInr,
      },
      silver: {
        usd: fallbackSilverUsd,
        inrPerGram: Number(((fallbackSilverUsd / OZ_TO_GRAM) * fallbackUsdInr).toFixed(4)),
        usdInr: fallbackUsdInr,
      },
      timestamp: new Date().toISOString(),
      error: "Using fallback data",
    });
  }
}
