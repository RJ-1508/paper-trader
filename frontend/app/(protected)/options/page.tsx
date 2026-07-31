"use client";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { UNIVERSE, type Chain, type ChainRow, type OptionPosition } from "@/lib/options";

function atmIndex(rows: ChainRow[], spot: number) {
  return rows.reduce(
    (best, row, i) =>
      Math.abs(row.strike - spot) < Math.abs(rows[best].strike - spot) ? i : best,
    0,
  );
}

function OptionsTable({
  title,
  rows,
  spot,
  onSelect,
}: {
  title: string;
  rows: ChainRow[];
  spot: number;
  onSelect: (row: ChainRow) => void;
}) {
  const atmIdx = rows.length ? atmIndex(rows, spot) : -1;

  return (
    <div className="clearing p-4 mb-12">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th colSpan={2} />
            <th
              colSpan={3}
              className="border-l border-hairline-strong text-center text-xs font-semibold text-silver-dim px-2 py-1"
            >
              Market
            </th>
            <th
              colSpan={6}
              className="border-l border-hairline-strong text-center text-xs font-semibold text-silver-dim px-2 py-1"
            >
              Engine
            </th>
            <th />
          </tr>
          <tr className="border-b border-hairline text-left text-text-dim">
            <th className="px-2 py-1 text-left text-xs font-normal">Symbol</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Strike</th>
            <th className="px-2 py-1 text-right text-xs font-normal border-l border-hairline-strong">
              Bid
            </th>
            <th className="px-2 py-1 text-right text-xs font-normal">Ask</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Premium</th>
            <th className="px-2 py-1 text-right text-xs font-normal border-l border-hairline-strong">
              IV
            </th>
            <th className="px-2 py-1 text-right text-xs font-normal">Delta</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Gamma</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Theta/d</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Vega/pt</th>
            <th className="px-2 py-1 text-right text-xs font-normal">Rho</th>
            <th className="px-2 py-1 text-right text-xs font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isAtm = i === atmIdx;
            return (
              <tr
                key={row.symbol}
                className={`border-b border-hairline ${isAtm ? "bg-panel-2" : "hover:bg-panel-2"}`}
              >
                <td
                  className={`px-2 py-0.5 text-xs font-mono tabular-nums ${
                    isAtm ? "border-l-2 border-hairline-strong" : ""
                  }`}
                >
                  {row.symbol}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {row.strike}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums border-l border-hairline-strong">
                  {row.bid}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">{row.ask}</td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {row.premium}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums text-accent border-l border-hairline-strong">
                  {(row.implied_vol * 100).toFixed(1)}%
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {row.delta?.toFixed(4)}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {row.gamma?.toFixed(4)}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {(row.theta / 365).toFixed(3)}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {(row.vega / 100).toFixed(2)}
                </td>
                <td className="px-2 py-0.5 text-xs text-right font-mono tabular-nums">
                  {row.rho?.toFixed(4)}
                </td>
                <td className="px-2 py-0.5 text-xs text-right">
                  <button
                    onClick={() => onSelect(row)}
                    className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-2 py-1 text-xs transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    Trade
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TradeTicket({
  row,
  onClose,
}: {
  row: ChainRow;
  onClose: () => void;
}) {
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filled, setFilled] = useState<OptionPosition | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/options/positions", {
        occSymbol: row.symbol,
        direction,
        quantity,
      });
      setFilled(res.data);
    } catch (err) {
      const message = (err as AxiosError<{ error: string }>).response?.data?.error;
      if (message === "Insufficient buying power") {
        setError("Not enough buying power for this order. Reduce the quantity or add cash.");
      } else if (message === "Insufficient cash to secure put") {
        setError(
          "Not enough cash to secure this put. A short put reserves strike x 100 x quantity.",
        );
      } else if (message === "Not enough shares to cover call") {
        setError("Not enough shares to cover this call. A short call reserves 100 shares per contract.");
      } else if (message === "No market price available for contract") {
        setError("No market price for this contract right now. Try another strike or refresh the chain.");
      } else if (message === "Portfolio not found") {
        setError("Portfolio not found.");
      } else {
        setError("Could not open the position. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clearing p-6 mb-12 max-w-md">
      <h2 className="text-lg font-semibold mb-2">Trade ticket</h2>
      <p className="mb-4 font-mono tabular-nums text-text-dim">
        {row.symbol} — {row.type} ${row.strike} exp {row.expiry}
      </p>

      {filled ? (
        <div>
          <p className="mb-2">Position opened.</p>
          <p className="text-sm text-text-dim font-mono tabular-nums">
            Filled premium: ${Number(filled.openPremium).toFixed(2)}
          </p>
          <p className="text-sm text-text-dim font-mono tabular-nums">
            Collateral cash: ${Number(filled.collateralCash).toFixed(2)}
          </p>
          <p className="text-sm text-text-dim font-mono tabular-nums mb-4">
            Reserved shares: {filled.reservedShares}
          </p>
          <button
            onClick={onClose}
            className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-3 py-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDirection("LONG")}
              disabled={direction === "LONG"}
              className={`rounded-control px-3 py-2 border transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                direction === "LONG"
                  ? "border-hairline-strong text-text"
                  : "border-hairline text-text-dim hover:text-text hover:border-hairline-strong"
              }`}
            >
              Buy to open
            </button>
            <button
              onClick={() => setDirection("SHORT")}
              disabled={direction === "SHORT"}
              className={`rounded-control px-3 py-2 border transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                direction === "SHORT"
                  ? "border-hairline-strong text-text"
                  : "border-hairline text-text-dim hover:text-text hover:border-hairline-strong"
              }`}
            >
              Sell to open
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-text-dim mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.trunc(Number(e.target.value))))}
              className="bg-panel-2 border border-hairline rounded-control px-3 py-2 w-24 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            />
          </div>

          <div className="bg-panel-2 rounded-control p-3 mb-4 text-sm text-text-dim">
            Collateral requirement is calculated when the position opens.
          </div>

          {error && <p className="text-down mb-4">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-accent text-ink rounded-control px-3 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Open position
            </button>
            <button
              onClick={onClose}
              className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-3 py-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function OptionsPage() {
  const [sym, setSym] = useState("AAPL");
  const [chain, setChain] = useState<Chain | null>(null);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedRow, setSelectedRow] = useState<ChainRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/options/${sym}/chain`);
        if (cancelled) return;
        const data: Chain = res.data;
        const expiries = Array.from(new Set(data.rows.map((r) => r.expiry))).sort();
        setChain(data);
        setExpiry((prev) => (prev && expiries.includes(prev) ? prev : (expiries[0] ?? "")));
      } catch (err) {
        if (cancelled) return;
        setChain(null);
        setError(
          (err as AxiosError).response?.status === 502
            ? "The pricing engine is not responding. Start the engine, then refresh."
            : "Could not load the chain. Refresh to try again.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sym, reloadToken]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const expiries = chain ? Array.from(new Set(chain.rows.map((r) => r.expiry))).sort() : [];
  const callRows = chain
    ? chain.rows
        .filter((r) => r.type === "call" && r.expiry === expiry)
        .sort((a, b) => a.strike - b.strike)
    : [];
  const putRows = chain
    ? chain.rows
        .filter((r) => r.type === "put" && r.expiry === expiry)
        .sort((a, b) => a.strike - b.strike)
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Options Chain</h1>

      <div className="flex gap-2 mb-6 items-center">
        {UNIVERSE.map((t) => (
          <button
            key={t}
            onClick={() => setSym(t)}
            disabled={sym === t}
            className={`rounded-control px-3 py-2 border transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
              sym === t
                ? "border-hairline-strong text-text"
                : "border-hairline text-text-dim hover:text-text hover:border-hairline-strong"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-control px-3 py-2 border border-hairline hover:border-hairline-strong text-text-dim hover:text-text transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Refresh
        </button>
      </div>

      {expiries.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm text-text-dim mb-1">Expiry</label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="bg-panel-2 border border-hairline rounded-control px-3 py-2 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            {expiries.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className="text-text-dim">Loading...</p>}
      {error && <p className="text-down">{error}</p>}

      {selectedRow && (
        <TradeTicket row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}

      {chain && !loading && !error && (
        <>
          <p className="mb-4">
            {chain.underlying} spot: <span className="font-mono tabular-nums">${chain.spot}</span>
          </p>

          {chain.rows.length === 0 ? (
            <p className="text-text-faint">
              No contracts available for {chain.underlying}. Try a different underlying or
              refresh.
            </p>
          ) : (
            <>
              <OptionsTable
                title="Calls"
                rows={callRows}
                spot={chain.spot}
                onSelect={setSelectedRow}
              />
              <OptionsTable
                title="Puts"
                rows={putRows}
                spot={chain.spot}
                onSelect={setSelectedRow}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
