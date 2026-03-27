"use client";

import { useEffect, useState } from "react";
import PriceCard from "@/components/PriceCard";
import Chart from "@/components/Chart";
import Calculator from "@/components/Calculator";

export default function Home() {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);

    const fetchData = async () => {
        const res = await fetch("/api/price");
        const json = await res.json();

        setData(json);
        setHistory((prev) => [
            ...prev.slice(-30),
            { time: Date.now(), gold: json.gold.k24, silver: json.silver },
        ]);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div>Loading...</div>;

    return (
        <div className="bg-black text-white min-h-screen p-6">
            <h1 className="text-3xl text-yellow-400 mb-4">Live Metals</h1>

            <PriceCard title="Gold 24K" value={data.gold.k24} />
            <PriceCard title="Silver" value={data.silver} />

            <Chart history={history} />

            <Calculator price={data.gold.k24} />

            <div className="text-green-400 mt-4">
                LIVE • {data.updatedAt}
            </div>
        </div>
    );
}