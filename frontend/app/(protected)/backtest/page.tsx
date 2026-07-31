"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";

type BacktestResult = {
  equityCurve: { date: string; totalValue: number }[];
  metrics: { totalReturn: number; sharpeRatio: number; maxDrawdown: number };
  trades: number;
};

export default function BacktestPage() {
  const [strategies, setStrategies] = useState<string[]>([]);
  const [ticker, setTicker] = useState("");
  const [strategy, setStrategy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/backtest/strategies")
      .then((res) => setStrategies(res.data.strategies))
      .catch(() => setError("Failed to load strategies"));
  }, []);

  const handleRun = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post("/backtest", { ticker, strategy, startDate, endDate });
      setResult(res.data);
    } catch (err) {
      setError(
        (err as AxiosError<{ error: string }>).response?.data?.error ?? "Backtest failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Backtest</h1>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="bg-panel-2 border border-hairline rounded-control px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        />

        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="bg-panel-2 border border-hairline rounded-control px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <option value="">Select a strategy</option>
          {strategies.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-text-dim mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-panel-2 border border-hairline rounded-control px-3 py-2 w-full font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-text-dim mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-panel-2 border border-hairline rounded-control px-3 py-2 w-full font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="bg-accent text-ink rounded-control px-4 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {loading ? "Running..." : "Run Backtest"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-down">{error}</p>}

      {result && (
        <div className="clearing mt-12 p-4">
          <h2 className="text-lg font-semibold mb-3">
            {strategy} on {ticker}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-text-dim">Total return</div>
              <div className={`font-mono tabular-nums font-semibold ${result.metrics.totalReturn >= 0 ? "text-up" : "text-down"}`}>
                {(result.metrics.totalReturn * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-text-dim">Sharpe ratio</div>
              <div className="font-mono tabular-nums font-semibold">{result.metrics.sharpeRatio.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-text-dim">Max drawdown</div>
              <div className="font-mono tabular-nums font-semibold">{(result.metrics.maxDrawdown * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-sm text-text-dim">Trades executed</div>
              <div className="font-mono tabular-nums font-semibold">{result.trades}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
