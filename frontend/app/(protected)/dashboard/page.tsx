"use client";
import {useEffect, useState} from "react";
import api from "@/lib/api";

export default function Dashboard() {
    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/portfolio")
        .then((res) => setPortfolio(res.data))
        .catch(() => setError("Failed to load portfolio"))
        .finally(() => setLoading(false));
    }, []);
    if (loading) return <div className="p-6">Loading...</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

            <div className="text-3xl font-bold">
                ${portfolio.totalPortfolioValue?.toLocaleString()}
            </div>
            <div className="mb-6 text-gray-600">
                Cash: ${portfolio.cashBalance?.toLocaleString()}
            </div>
            <h2 className="text-lg font-semibold mb-2">Holdings</h2>
            {portfolio.holdings.length === 0 ? (
                <p className="text-gray-500">No holdings yet - go trade.</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b text-left">
                            <th className="p-2">Ticker</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Avg Cost</th>
                            <th className="p-2">Current Price</th>
                            <th className="p-2">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolio.holdings.map((h: any) => (
                            <tr key={h.ticker} className="border-b">
                                <td className="p-2">{h.ticker}</td>
                                <td className="p-2">{h.quantity}</td>
                                <td className="p-2">{h.avgPrice}</td>
                                <td className="p-2">{h.currPrice}</td>
                                <td className="p-2">{h.currentValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}