"use client";
import { useState } from "react";
import api from "@/lib/api"
import { AxiosError } from "axios";

export default function TradePage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedTicker, setSelectedTicker] = useState<string | undefined>();
    const [quote, setQuote] = useState<any>(null);
    const [shares, setShares] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setMessage("");
        setLoading(true);
        try {
            const res = await api.get(`/market/search?q=${encodeURIComponent(query)}`);
            setResults(res.data);
        } catch {
            setMessage("Search failed")
        } finally {
            setLoading(false);
        }
    }

    const handleSelectTicker = async (ticker: string) => {
        setSelectedTicker(ticker);
        setQuote(null);
        try {
            const res = await api.get(`/market/quote/${ticker}`);
            setQuote(res.data);
        } catch {
            setMessage("Failed to load quote");
        }
    };

    const handleTrade = async (type: "buy" | "sell") => {
        setMessage("")
        try {
            await api.post(`/trade/${type}`, {
                ticker: selectedTicker,
                shares: Number(shares),
            });
            setMessage(`${type === 'buy' ? 'Bought' : 'Sold'} ${shares} ${selectedTicker}`);
            setShares("")
        } catch (err) {
            setMessage(
                (err as AxiosError<{ error: string }>).response?.data?.error ?? "Trade failed"
            );
        }
    }
    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Trade</h1>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    placeholder="Search ticker (e.g.) AAPL"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border rounded px-3 py-2 flex-1"
                />
                <button type="button" onClick={handleSearch} disabled={loading}
                    className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {results.length > 0 && (
                <div className="border rounded mb-4 divide-y">
                    {results.map((r) => (
                    <div key={r.symbol} onClick={() => handleSelectTicker(r.symbol)}
                        className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="font-semibold">{r.symbol}</span> — {r.description}
                    </div>
                    ))}
                </div>
            )}

        {selectedTicker && (
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">{selectedTicker}</h2>
        {quote ? (
          <div className="mb-3">
            <div>Current price: ${quote.currentPrice}</div>
            <div className="text-sm text-gray-600">
              High: ${quote.high} · Low: ${quote.low}
            </div>
          </div>
        ) : (
          <div className="mb-3">Loading quote...</div>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
          <button type="button" onClick={() => handleTrade("buy")}
            className="bg-green-600 text-white rounded px-4 py-2">
            Buy
          </button>
          <button type="button" onClick={() => handleTrade("sell")}
            className="bg-red-600 text-white rounded px-4 py-2">
            Sell
          </button>
        </div>
      </div>
    )}

    {message && <p className="mt-3 text-sm">{message}</p>}
  </div>
);
}