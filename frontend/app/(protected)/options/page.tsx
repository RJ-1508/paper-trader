"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const UNIVERSE = ["SPY", "AAPL", "MSFT", "NVDA", "TSLA"];

type Row = {
  symbol: string;
  strike: number;
  type: string;
  expiry: string;
  bid: number;
  ask: number;
  premium: number;
  implied_vol: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};

type Chain = {
  underlying: string;
  spot: number;
  rows: Row[];
};

export default function OptionsPage() {
  const [sym, setSym] = useState("AAPL");
  const [chain, setChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setChain(null);
    api
      .get(`/options/${sym}/chain`)
      .then((r) => setChain(r.data))
      .finally(() => setLoading(false));
  }, [sym]);

  const atmIdx = chain
    ? chain.rows.reduce(
        (best, row, i) =>
          Math.abs(row.strike - chain.spot) <
          Math.abs(chain.rows[best].strike - chain.spot)
            ? i
            : best,
        0,
      )
    : -1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Options Chain</h1>

      <div className="flex gap-2 mb-4">
        {UNIVERSE.map((t) => (
          <button key={t} onClick={() => setSym(t)} disabled={sym === t}>
            {t}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {chain && (
        <>
          <p className="mb-2">
            {chain.underlying} spot: ${chain.spot}
          </p>
          <table>
            <thead>
              <tr>
                <th colSpan={4} />
                <th colSpan={2} className="bg-blue-100 text-center text-xs font-semibold px-2 py-1">
                  Market
                </th>
                <th colSpan={6} className="bg-amber-100 text-center text-xs font-semibold px-2 py-1">
                  Engine
                </th>
              </tr>
              <tr>
                <th className="px-2 py-1 text-left text-xs">Symbol</th>
                <th className="px-2 py-1 text-left text-xs">Type</th>
                <th className="px-2 py-1 text-right text-xs">Strike</th>
                <th className="px-2 py-1 text-left text-xs">Expiry</th>
                <th className="bg-blue-50 px-2 py-1 text-right text-xs">Bid</th>
                <th className="bg-blue-50 px-2 py-1 text-right text-xs">Ask</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">IV</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">Delta</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">Gamma</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">Theta/d</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">Vega/pt</th>
                <th className="bg-amber-50 px-2 py-1 text-right text-xs">Rho</th>
              </tr>
            </thead>
            <tbody>
              {chain.rows.map((row, i) => {
                const isAtm = i === atmIdx;
                const atm = "bg-yellow-200";
                const mkt = isAtm ? atm : "bg-blue-50";
                const eng = isAtm ? atm : "bg-amber-50";
                const base = isAtm ? atm : "";
                return (
                  <tr key={row.symbol}>
                    <td className={`${base} px-2 py-0.5 text-xs font-mono`}>{row.symbol}</td>
                    <td className={`${base} px-2 py-0.5 text-xs`}>{row.type}</td>
                    <td className={`${base} px-2 py-0.5 text-xs text-right`}>{row.strike}</td>
                    <td className={`${base} px-2 py-0.5 text-xs`}>{row.expiry}</td>
                    <td className={`${mkt} px-2 py-0.5 text-xs text-right`}>{row.bid}</td>
                    <td className={`${mkt} px-2 py-0.5 text-xs text-right`}>{row.ask}</td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {(row.implied_vol * 100).toFixed(1)}%
                    </td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {row.delta?.toFixed(4)}
                    </td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {row.gamma?.toFixed(4)}
                    </td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {(row.theta / 365).toFixed(3)}
                    </td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {(row.vega / 100).toFixed(2)}
                    </td>
                    <td className={`${eng} px-2 py-0.5 text-xs text-right`}>
                      {row.rho?.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
