export async function fetchTradingView(symbol) {
    const res = await fetch("https://scanner.tradingview.com/forex/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            symbols: { tickers: [symbol], query: { types: [] } },
            columns: ["close"],
        }),
    });

    const data = await res.json();
    return data.data[0].d[0];
}

export async function fetchUSDINR() {
    const res = await fetch(
        "https://api.exchangerate.host/latest?base=USD&symbols=INR"
    );
    const data = await res.json();
    return data.rates.INR;
}

export function convertGold(usd, inr) {
    const g = (usd * inr) / 31.1035;
    return {
        k24: g,
        k22: g * (22 / 24),
        k18: g * (18 / 24),
    };
}

export function convertSilver(usd, inr) {
    return (usd * inr) / 31.1035;
}

export async function getMetalData() {
    const goldUSD = await fetchTradingView("OANDA:XAUUSD");
    const silverUSD = await fetchTradingView("TVC:SILVER");
    const usdInr = await fetchUSDINR();

    const gold = convertGold(goldUSD, usdInr);
    const silver = convertSilver(silverUSD, usdInr);

    return {
        gold,
        silver,
        updatedAt: new Date().toLocaleTimeString(),
    };
}