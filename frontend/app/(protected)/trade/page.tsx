"use client";
import { useState } from "react";
import api from "@/lib/api"
import { AxiosError } from "axios";

type SearchResult = { symbol: string; description: string };
type Quote = { currentPrice: number; high: number; low: number };

export default function TradePage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedTicker, setSelectedTicker] = useState<string | undefined>();
    const [quote, setQuote] = useState<Quote | null>(null);
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
                    className="bg-panel-2 border border-hairline rounded-control px-3 py-2 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                />
                <button type="button" onClick={handleSearch} disabled={loading}
                    className="bg-accent text-ink rounded-control px-4 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {results.length > 0 && (
                <div className="clearing mb-12 divide-y divide-hairline">
                    {results.map((r) => (
                    <button key={r.symbol} type="button" onClick={() => handleSelectTicker(r.symbol)}
                        className="w-full text-left p-2 cursor-pointer hover:bg-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                        <span className="font-semibold">{r.symbol}</span> — {r.description}
                    </button>
                    ))}
                </div>
            )}

        {selectedTicker && (
      <div className="clearing p-4">
        <h2 className="text-lg font-semibold mb-2">{selectedTicker}</h2>
        {quote ? (
          <div className="mb-3">
            <div className="font-mono tabular-nums">Current price: ${quote.currentPrice}</div>
            <div className="text-sm text-text-dim font-mono tabular-nums">
              High: ${quote.high} · Low: ${quote.low}
            </div>
          </div>
        ) : (
          <div className="mb-3 text-text-dim">Loading quote...</div>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="bg-panel-2 border border-hairline rounded-control px-3 py-2 w-32 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          />
          <button type="button" onClick={() => handleTrade("buy")}
            className="bg-accent text-ink rounded-control px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            Buy
          </button>
          <button type="button" onClick={() => handleTrade("sell")}
            className="bg-accent text-ink rounded-control px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            Sell
          </button>
        </div>
      </div>
    )}

    {message && <p className="mt-3 text-sm text-text-dim">{message}</p>}
  </div>
);
}
