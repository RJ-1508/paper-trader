"use client";
import {useEffect, useState} from "react";
import api from "@/lib/api";
import CountUp from "@/components/CountUp";

type Holding = {
    id: number;
    portfolioId: number;
    ticker: string;
    quantity: string;
    avgPrice: string;
    createdAt: string;
    updatedAt: string;
    currPrice: number;
    currentValue: number;
};

type Portfolio = {
    holdings: Holding[];
    cashBalance: number;
    totalPortfolioValue: number;
};

export default function Dashboard() {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/portfolio")
        .then((res) => setPortfolio(res.data))
        .catch(() => setError("Failed to load portfolio"))
        .finally(() => setLoading(false));
    }, []);
    if (loading) return <div className="p-6 text-text-dim">Loading...</div>
    if (error) return <div className="p-6 text-down">{error}</div>
    if (!portfolio) return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            <div className="clearing p-6 mb-12">
                <div className="text-4xl font-mono tabular-nums">
                    $<CountUp value={portfolio.totalPortfolioValue ?? 0} />
                </div>
                <div className="mt-2 font-mono tabular-nums text-text-dim">
                    Cash: ${portfolio.cashBalance?.toLocaleString()}
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Holdings</h2>
            {portfolio.holdings.length === 0 ? (
                <p className="text-text-faint">No holdings yet — go trade.</p>
            ) : (
                <div className="clearing p-4">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-hairline text-left text-text-dim">
                                <th className="p-2 font-normal">Ticker</th>
                                <th className="p-2 font-normal">Quantity</th>
                                <th className="p-2 font-normal">Avg Cost</th>
                                <th className="p-2 font-normal">Current Price</th>
                                <th className="p-2 font-normal">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolio.holdings.map((h) => (
                                <tr key={h.ticker} className="border-b border-hairline hover:bg-panel-2">
                                    <td className="p-2">{h.ticker}</td>
                                    <td className="p-2 font-mono tabular-nums">{h.quantity}</td>
                                    <td className="p-2 font-mono tabular-nums">{h.avgPrice}</td>
                                    <td className="p-2 font-mono tabular-nums">{h.currPrice}</td>
                                    <td className="p-2 font-mono tabular-nums">{h.currentValue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
