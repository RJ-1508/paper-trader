"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type Transaction = {
    id: number;
    portfolioId: number;
    ticker: string;
    type: "BUY" | "SELL";
    quantity: string;
    price: string;
    totalAmount: string;
    createdAt: string;
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/portfolio/transactions")
        .then((res) => setTransactions(res.data.transactions))
        .catch(() => setError("Failed to load transactions"))
        .finally(() => setLoading(false));
    }, [])

    if (loading) return <div className="p-6 text-text-dim">Loading...</div>;
    if (error) return <div className="p-6 text-down">{error}</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Transactions</h1>
            {transactions.length === 0 ? (
                <p className="text-text-faint">No transactions yet — go trade.</p>
            ) : (
                <div className="clearing p-4">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-hairline text-left text-text-dim">
                                <th className="p-2 font-normal">Date</th>
                                <th className="p-2 font-normal">Ticker</th>
                                <th className="p-2 font-normal">Type</th>
                                <th className="p-2 font-normal">Quantity</th>
                                <th className="p-2 font-normal">Price</th>
                                <th className="p-2 font-normal">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t: Transaction) => (
                                <tr key={t.id} className="border-b border-hairline hover:bg-panel-2">
                                    <td className="p-2 font-mono tabular-nums">{new Date(t.createdAt).toLocaleDateString()}</td>
                                    <td className="p-2 font-semibold">{t.ticker}</td>
                                    <td className={`p-2 font-semibold ${t.type === "BUY" ? "text-up" : "text-down"}`}>
                                        {t.type}
                                    </td>
                                    <td className="p-2 font-mono tabular-nums">{t.quantity}</td>
                                    <td className="p-2 font-mono tabular-nums">${Number(t.price).toLocaleString()}</td>
                                    <td className="p-2 font-mono tabular-nums">${Number(t.totalAmount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
