import { NextResponse } from 'next/server';

const OZ_TO_GRAM = 31.1034768;

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
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
    });

    if (!res.ok) return null;

    const data = await safeJson(res);
    const price = data?.data?.[0]?.d?.[0];

    return typeof price === 'number' && Number.isFinite(price) ? price : null;
  } catch (error) {
    console.error(`TradingView failed for ${symbol}:`, error);
    return null;
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
    );

    if (!res.ok) return null;

    const data = await safeJson(res);
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    return typeof price === 'number' && Number.isFinite(price) ? price : null;
  } catch (error) {
    console.error(`Yahoo failed for ${symbol}:`, error);
    return null;
  }
}

async function fetchUSDINR() {
  const sources = [
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 120 },
      });
      if (!res.ok) return null;
      const data = await safeJson(res);
      return data?.rates?.INR;
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
      );
      if (!res.ok) return null;
      const data = await safeJson(res);
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    },
  ];

  for (const source of sources) {
    try {
      const rate = await source();
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        return rate;
      }
    } catch {
      // try next source
    }
  }

  return 86.5;
}

export async function GET() {
  try {
    const usdInr = await fetchUSDINR();

    let goldUSD = null;
    let silverUSD = null;
    let goldSource = 'fallback';
    let silverSource = 'fallback';

    goldUSD = await fetchTradingView('TVC:XAUUSD');
    if (!goldUSD) goldUSD = await fetchTradingView('OANDA:XAUUSD');
    if (goldUSD) {
      goldSource = 'TradingView';
    } else {
      goldUSD = await fetchYahooFinance('GC=F');
      if (goldUSD) goldSource = 'Yahoo';
    }

    silverUSD = await fetchTradingView('TVC:XAGUSD');
    if (!silverUSD) silverUSD = await fetchTradingView('OANDA:XAGUSD');
    if (silverUSD) {
      silverSource = 'TradingView';
    } else {
      silverUSD = await fetchYahooFinance('SI=F');
      if (silverUSD) silverSource = 'Yahoo';
    }

    const finalGoldUSD =
      typeof goldUSD === 'number' && Number.isFinite(goldUSD) ? goldUSD : 2650;
    const finalSilverUSD =
      typeof silverUSD === 'number' && Number.isFinite(silverUSD) ? silverUSD : 32.5;

    const goldINRPerGram = (finalGoldUSD / OZ_TO_GRAM) * usdInr;
    const silverINRPerGram = (finalSilverUSD / OZ_TO_GRAM) * usdInr;

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('API Route Error:', error);

    const fallbackUsdInr = 86.5;
    const fallbackGold = 2650;
    const fallbackSilver = 32.5;

    return NextResponse.json({
      success: false,
      gold: {
        usd: fallbackGold,
        inrPerGram: Number(((fallbackGold / OZ_TO_GRAM) * fallbackUsdInr).toFixed(2)),
        usdInr: fallbackUsdInr,
        source: 'fallback',
      },
      silver: {
        usd: fallbackSilver,
        inrPerGram: Number(((fallbackSilver / OZ_TO_GRAM) * fallbackUsdInr).toFixed(4)),
        usdInr: fallbackUsdInr,
        source: 'fallback',
      },
      timestamp: new Date().toISOString(),
      error: 'Using fallback data due to external API issues',
    });
  }
}
