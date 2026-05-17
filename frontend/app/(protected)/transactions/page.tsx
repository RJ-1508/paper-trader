"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/portfolio/transactions")
        .then((res) => setTransactions(res.data.transactions))
        .catch(() => setError("Failed to load transactions"))
        .finally(() => setLoading(false));
    }, [])

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Transactions</h1>
            {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions yet — go trade.</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b text-left">
                            <th className="p-2">Date</th>
                            <th className="p-2">Ticker</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Price</th>
                            <th className="p-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t: any) => (
                            <tr key={t.id} className="border-b">
                                <td className="p-2">{new Date(t.createdAt).toLocaleDateString()}</td>
                                <td className="p-2 font-semibold">{t.ticker}</td>
                                <td className={`p-2 font-semibold ${t.type === "buy" ? "text-green-600" : "text-red-600"}`}>
                                    {t.type.toUpperCase()}
                                </td>
                                <td className="p-2">{t.quantity}</td>
                                <td className="p-2">${Number(t.price).toLocaleString()}</td>
                                <td className="p-2">${Number(t.totalAmount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
