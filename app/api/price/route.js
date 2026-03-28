import { NextResponse } from 'next/server';

// Robust TradingView price fetch
async function fetchTradingView(symbol: string): Promise<number | null> {
  try {
    const payload = {
      symbols: { tickers: [symbol], query: { types: [] } },
      columns: ["close"],
    };

    const res = await fetch("https://scanner.tradingview.com/forex/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      next: { revalidate: 15 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const price = data?.data?.[0]?.d?.[0];

    return typeof price === "number" && !isNaN(price) && price > 100 ? price : null;
  } catch (err) {
    console.error(`TradingView failed for ${symbol}:`, err);
    return null;
  }
}

// Yahoo fallback
async function fetchYahooFinance(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/charts/${symbol}`, {
      next: { revalidate: 15 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch (err) {
    console.error(`Yahoo failed for ${symbol}:`, err);
    return null;
  }
}

// USD/INR with multiple reliable sources
async function fetchUSDINR(): Promise<number> {
  const sources = [
    // Frankfurter
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', { next: { revalidate: 60 } });
      const data = await res.json();
      return data?.rates?.INR;
    },
    // Yahoo
    async () => fetchYahooFinance("USDINR=X"),
    // TradingView attempt
    async () => fetchTradingView("FX_IDC:USDINR") || fetchTradingView("USDINR=X"),
  ];

  for (const src of sources) {
    try {
      const rate = await src();
      if (rate && rate > 80 && rate < 110) return rate; // realistic bounds
    } catch {}
  }

  console.warn("USD/INR sources failed → fallback 95");
  return 95.0;
}

export async function GET() {
  try {
    const usdInr = await fetchUSDINR();

    // Try multiple reliable symbols
    let goldUSD =
      (await fetchTradingView("OANDA:XAUUSD")) ||
      (await fetchTradingView("TVC:GOLD")) ||
      (await fetchTradingView("FX_IDC:XAUUSD")) ||
      (await fetchYahooFinance("GC=F"));

    let silverUSD =
      (await fetchTradingView("OANDA:XAGUSD")) ||
      (await fetchTradingView("TVC:SILVER")) ||
      (await fetchYahooFinance("SI=F"));

    // Realistic fallback values (update occasionally)
    if (!goldUSD) goldUSD = 4490;
    if (!silverUSD) silverUSD = 32.8;

    const OZ_TO_GRAM = 31.1034768; // precise troy ounce → gram

    // CORRECT CALCULATION
    const goldINRPerGram = (goldUSD * usdInr) / OZ_TO_GRAM;
    const silverINRPerGram = (silverUSD * usdInr) / OZ_TO_GRAM;

    return NextResponse.json({
      success: true,
      usdInr: Number(usdInr.toFixed(2)),
      gold: {
        usdPerOunce: Number(goldUSD.toFixed(2)),
        inrPerGram: Number(goldINRPerGram.toFixed(2)),
        inrPer10Gram: Number((goldINRPerGram * 10).toFixed(0)), // common in India
      },
      silver: {
        usdPerOunce: Number(silverUSD.toFixed(4)),
        inrPerGram: Number(silverINRPerGram.toFixed(2)),
        inrPer10Gram: Number((silverINRPerGram * 10).toFixed(0)),
      },
      timestamp: new Date().toISOString(),
      source: "tradingview + fallback",
    });

  } catch (error: any) {
    console.error("API Error:", error);

    // Safe fallback
    const fallbackUsdInr = 95.0;
    const fallbackGoldUsd = 4490;
    const fallbackSilverUsd = 32.8;
    const OZ_TO_GRAM = 31.1034768;

    const goldINRPerGram = (fallbackGoldUsd * fallbackUsdInr) / OZ_TO_GRAM;
    const silverINRPerGram = (fallbackSilverUsd * fallbackUsdInr) / OZ_TO_GRAM;

    return NextResponse.json({
      success: false,
      usdInr: fallbackUsdInr,
      gold: {
        usdPerOunce: fallbackGoldUsd,
        inrPerGram: Number(goldINRPerGram.toFixed(2)),
        inrPer10Gram: Number((goldINRPerGram * 10).toFixed(0)),
      },
      silver: {
        usdPerOunce: fallbackSilverUsd,
        inrPerGram: Number(silverINRPerGram.toFixed(2)),
        inrPer10Gram: Number((silverINRPerGram * 10).toFixed(0)),
      },
      timestamp: new Date().toISOString(),
      error: "Using fallback data",
    });
  }
}
