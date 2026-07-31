"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { AxiosError } from "axios";
import type { Greeks, NetGreeks, ScenarioResult } from "@/lib/options";
import CountUp from "@/components/CountUp";

const signClass = (value: number) => (value >= 0 ? "text-up" : "text-down");
const fmtGreek = (value: number) => value.toFixed(4);

const errorMessage = (err: unknown, fallback: string) => {
  const res = (err as AxiosError<{ error: string }>).response;
  if (res?.status === 502)
    return "The pricing engine is not responding. Start the engine, then try again.";
  if (res?.data?.error === "Portfolio not found") return "Portfolio not found";
  return fallback;
};
const fmtMoney = (value: number) => value.toFixed(2);

const inputClass =
  "bg-panel-2 border border-hairline rounded-control px-3 py-2 w-32 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const primaryButtonClass =
  "bg-accent text-ink rounded-control px-4 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const GreekCells = ({ greeks }: { greeks: Greeks }) => (
  <>
    <td className={`p-2 font-mono tabular-nums ${signClass(greeks.delta)}`}>{fmtGreek(greeks.delta)}</td>
    <td className={`p-2 font-mono tabular-nums ${signClass(greeks.gamma)}`}>{fmtGreek(greeks.gamma)}</td>
    <td className={`p-2 font-mono tabular-nums ${signClass(greeks.theta)}`}>{fmtGreek(greeks.theta)}</td>
    <td className={`p-2 font-mono tabular-nums ${signClass(greeks.vega)}`}>{fmtGreek(greeks.vega)}</td>
    <td className={`p-2 font-mono tabular-nums ${signClass(greeks.rho)}`}>{fmtGreek(greeks.rho)}</td>
  </>
);

export default function RiskPage() {
  const [netGreeks, setNetGreeks] = useState<NetGreeks | null>(null);
  const [netLoading, setNetLoading] = useState(true);
  const [netError, setNetError] = useState("");

  const [dSpotPct, setDSpotPct] = useState("0");
  const [dVolPts, setDVolPts] = useState("0");
  const [dDays, setDDays] = useState("0");

  const [estimate, setEstimate] = useState<ScenarioResult | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  const [exact, setExact] = useState<ScenarioResult | null>(null);
  const [exactLoading, setExactLoading] = useState(false);
  const [exactError, setExactError] = useState("");

  useEffect(() => {
    async function fetchNetGreeks() {
      setNetLoading(true);
      try {
        const res = await api.get("/options/greeks/net");
        setNetGreeks(res.data);
      } catch (err) {
        setNetError(errorMessage(err, "Could not load net Greeks. Try again."));
      } finally {
        setNetLoading(false);
      }
    }
    fetchNetGreeks();
  }, []);

  const handleShockChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setEstimate(null);
    setExact(null);
  };

  const handleRunEstimate = async () => {
    setEstimateLoading(true);
    setEstimateError("");
    try {
      const res = await api.get("/options/scenario", {
        params: { mode: "approx", dSpotPct, dVolPts, dDays },
      });
      setEstimate(res.data);
    } catch (err) {
      setEstimateError(errorMessage(err, "Could not run the scenario. Try again."));
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleRunExact = async () => {
    setExactLoading(true);
    setExactError("");
    try {
      const res = await api.get("/options/scenario", {
        params: { mode: "exact", dSpotPct, dVolPts, dDays },
      });
      setExact(res.data);
    } catch (err) {
      setExactError(errorMessage(err, "Could not run the scenario. Try again."));
    } finally {
      setExactLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Portfolio risk</h1>

      <h2 className="text-lg font-semibold mb-3">Net Greeks</h2>
      {netLoading ? (
        <p className="text-text-dim mb-12">Loading...</p>
      ) : netError ? (
        <p className="text-down mb-12">{netError}</p>
      ) : !netGreeks ? null : Object.keys(netGreeks.byUnderlying).length === 0 ? (
        <p className="text-text-dim mb-12">
          No open positions yet.{" "}
          <Link
            href="/options"
            className="text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Open one from the chain
          </Link>{" "}
          to see your net Greeks.
        </p>
      ) : (
        <>
          <div className="clearing p-4 mb-12">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-text-dim">
                  <th className="p-2 font-normal">Delta</th>
                  <th className="p-2 font-normal">Gamma</th>
                  <th className="p-2 font-normal">Theta</th>
                  <th className="p-2 font-normal">Vega</th>
                  <th className="p-2 font-normal">Rho</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <GreekCells greeks={netGreeks.net} />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="clearing p-4 mb-12">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-text-dim">
                  <th className="p-2 font-normal">Underlying</th>
                  <th className="p-2 font-normal">Spot</th>
                  <th className="p-2 font-normal">Delta</th>
                  <th className="p-2 font-normal">Gamma</th>
                  <th className="p-2 font-normal">Theta</th>
                  <th className="p-2 font-normal">Vega</th>
                  <th className="p-2 font-normal">Rho</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(netGreeks.byUnderlying).map(([ticker, greeks]) => (
                  <tr key={ticker} className="border-b border-hairline hover:bg-panel-2">
                    <td className="p-2">{ticker}</td>
                    <td className="p-2 font-mono tabular-nums">${greeks.spot.toLocaleString()}</td>
                    <GreekCells greeks={greeks} />
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-sm text-text-faint font-mono tabular-nums mt-3">
              As of {new Date(netGreeks.asOf).toLocaleString()}
            </p>
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold mb-3">Scenario</h2>
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-dim mb-1">Spot shock (%)</label>
          <input
            type="number"
            value={dSpotPct}
            onChange={(e) => handleShockChange(setDSpotPct)(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-text-dim mb-1">Vol shock (pts)</label>
          <input
            type="number"
            value={dVolPts}
            onChange={(e) => handleShockChange(setDVolPts)(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-text-dim mb-1">Time decay (days)</label>
          <input
            type="number"
            value={dDays}
            onChange={(e) => handleShockChange(setDDays)(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-12">
        <button type="button" onClick={handleRunEstimate} disabled={estimateLoading} className={primaryButtonClass}>
          {estimateLoading ? "Running..." : "Run scenario"}
        </button>
        <button type="button" onClick={handleRunExact} disabled={exactLoading} className={primaryButtonClass}>
          {exactLoading ? "Repricing..." : "Run exact reprice"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-12">
        <div className="clearing p-4">
          <h2 className="text-lg font-semibold mb-3">Estimate (approx)</h2>
          {estimateError ? (
            <p className="text-down">{estimateError}</p>
          ) : !estimate ? (
            <p className="text-text-dim">Not run yet.</p>
          ) : (
            <div>
              <div className={`text-xl font-bold mb-3 ${signClass(estimate.scenario.total)}`}>
                $<CountUp value={estimate.scenario.total} format={fmtMoney} />
              </div>
              {estimate.scenario.breakdown && (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left text-text-dim">
                      <th className="p-2 font-normal">Delta</th>
                      <th className="p-2 font-normal">Gamma</th>
                      <th className="p-2 font-normal">Vega</th>
                      <th className="p-2 font-normal">Theta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 font-mono tabular-nums ${signClass(estimate.scenario.breakdown.deltaPnl)}`}>
                        ${fmtMoney(estimate.scenario.breakdown.deltaPnl)}
                      </td>
                      <td className={`p-2 font-mono tabular-nums ${signClass(estimate.scenario.breakdown.gammaPnl)}`}>
                        ${fmtMoney(estimate.scenario.breakdown.gammaPnl)}
                      </td>
                      <td className={`p-2 font-mono tabular-nums ${signClass(estimate.scenario.breakdown.vegaPnl)}`}>
                        ${fmtMoney(estimate.scenario.breakdown.vegaPnl)}
                      </td>
                      <td className={`p-2 font-mono tabular-nums ${signClass(estimate.scenario.breakdown.thetaPnl)}`}>
                        ${fmtMoney(estimate.scenario.breakdown.thetaPnl)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="clearing p-4">
          <h2 className="text-lg font-semibold mb-3">Exact reprice</h2>
          {exactError ? (
            <p className="text-down">{exactError}</p>
          ) : !exact ? (
            <p className="text-text-dim">Not run yet.</p>
          ) : (
            <div className="text-xl font-bold text-accent">
              $<CountUp value={exact.scenario.total} format={fmtMoney} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
