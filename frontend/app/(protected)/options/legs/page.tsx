"use client";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { UNIVERSE, type Chain, type ChainRow, type Payoff, type Structure } from "@/lib/options";

type StagedLeg = { row: ChainRow; direction: "LONG" | "SHORT"; quantity: number };

type PayoffPreview = {
  underlying: string;
  legs: {
    occSymbol: string;
    underlying: string;
    strike: number;
    type: "call" | "put";
    expiry: string;
    direction: "LONG" | "SHORT";
    quantity: number;
    premium: number;
  }[];
  payoff: Payoff;
};

const controlClass =
  "bg-panel-2 border border-hairline rounded-control px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const primaryButtonClass =
  "bg-accent text-ink rounded-control px-4 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const secondaryButtonClass =
  "border border-hairline text-text-dim rounded-control px-3 py-2 hover:border-hairline-strong hover:text-text transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

function structureErrorMessage(err: AxiosError<{ error: string }>): string {
  switch (err.response?.data?.error) {
    case "At least one leg required":
      return "Add at least one leg before submitting.";
    case "Invalid leg":
      return "A leg is invalid. Check the contract, direction and quantity.";
    case "Legs must share one underlying":
      return "All legs must be on the same underlying.";
    case "Insufficient buying power":
      return "Not enough buying power for this structure. Reduce quantity or add cash.";
    case "Not enough shares to cover call":
      return "Not enough shares to cover a short call leg.";
    case "No market price available for contract":
      return "No market price for one of these contracts. Try different strikes or refresh.";
    case "Portfolio not found":
      return "Portfolio not found.";
    case "Structure not found":
    case "No open structure found":
      return "That structure is no longer open.";
    case "Structure has no legs":
      return "That structure has no legs to price.";
    default:
      return "Something went wrong. Try again.";
  }
}

async function fetchStructuresList(): Promise<Structure[]> {
  const res = await api.get("/options/structures");
  return res.data;
}

function PayoffStats({ payoff }: { payoff: Payoff }) {
  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-3">Strategy stats</h2>
      <div className="clearing p-4 mb-12">
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-text-dim">Breakevens: </span>
            {payoff.breakevens.length > 0 ? (
              <span className="font-mono tabular-nums">
                {payoff.breakevens.map((b) => `$${b.toFixed(2)}`).join(", ")}
              </span>
            ) : (
              <span className="text-text-dim">None</span>
            )}
          </div>
          <div>
            <span className="text-text-dim">Max profit: </span>
            {payoff.maxProfit != null ? (
              <span className="font-mono tabular-nums text-up">${payoff.maxProfit.toFixed(2)}</span>
            ) : payoff.unbounded.upside ? (
              <span className="text-text-dim">Unbounded</span>
            ) : (
              <span className="text-text-dim">-</span>
            )}
          </div>
          <div>
            <span className="text-text-dim">Max loss: </span>
            {payoff.maxLoss != null ? (
              <span className="font-mono tabular-nums text-down">${payoff.maxLoss.toFixed(2)}</span>
            ) : payoff.unbounded.downside ? (
              <span className="text-text-dim">Unbounded</span>
            ) : (
              <span className="text-text-dim">-</span>
            )}
          </div>
          <div>
            <span className="text-text-dim">Net debit/credit: </span>
            <span className="font-mono tabular-nums">${payoff.netDebitCredit.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-text-dim">Expiry: </span>
            <span className="font-mono tabular-nums">{payoff.expiry}</span>
          </div>
        </div>
        {payoff.mixedExpiries && (
          <p className="text-sm text-down">
            Legs span different expiries; this payoff is evaluated at a single expiry and is
            approximate.
          </p>
        )}
      </div>
      <div className="clearing min-h-[260px] flex items-center justify-center">
        <span className="text-text-faint">Payoff diagram</span>
      </div>
    </div>
  );
}

function StructureCard({
  structure,
  expanded,
  detail,
  detailLoading,
  detailError,
  closing,
  onToggleExpand,
  onClose,
}: {
  structure: Structure;
  expanded: boolean;
  detail: Structure | undefined;
  detailLoading: boolean;
  detailError: string;
  closing: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center bg-panel-2 rounded-control px-3 py-2 mb-2">
        <div>
          <span className="font-semibold text-silver">{structure.label}</span>{" "}
          <span className="text-sm text-silver-dim">{structure.status}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-silver-dim">
            Net debit/credit:{" "}
            <span className="font-mono tabular-nums text-text">${structure.netDebitCredit.toFixed(2)}</span>
          </span>
          <span className="text-sm text-silver-dim">
            Unrealized P&L:{" "}
            <span
              className={`font-mono tabular-nums ${structure.unrealizedPnL >= 0 ? "text-up" : "text-down"}`}
            >
              ${structure.unrealizedPnL.toFixed(2)}
            </span>
          </span>
          <button onClick={onToggleExpand} className={secondaryButtonClass}>
            {expanded ? "Hide stats" : "Show stats"}
          </button>
          {structure.status === "OPEN" && (
            <button onClick={onClose} disabled={closing} className={secondaryButtonClass}>
              Close structure
            </button>
          )}
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-text-dim">
            <th className="p-2 font-normal">Contract</th>
            <th className="p-2 font-normal">Type</th>
            <th className="p-2 font-normal">Direction</th>
            <th className="p-2 font-normal">Quantity</th>
            <th className="p-2 font-normal">Strike</th>
            <th className="p-2 font-normal">Open premium</th>
            <th className="p-2 font-normal">Mark</th>
            <th className="p-2 font-normal">Unrealized P&L</th>
          </tr>
        </thead>
        <tbody>
          {structure.legs.map((leg) => (
            <tr key={leg.id} className="border-b border-hairline hover:bg-panel-2">
              <td className="p-2 font-mono text-xs tabular-nums">{leg.occSymbol}</td>
              <td className="p-2">{leg.optionType}</td>
              <td className="p-2">{leg.direction}</td>
              <td className="p-2 font-mono tabular-nums">{leg.quantity}</td>
              <td className="p-2 font-mono tabular-nums">${Number(leg.strike).toFixed(2)}</td>
              <td className="p-2 font-mono tabular-nums">${Number(leg.openPremium).toFixed(2)}</td>
              <td className="p-2 font-mono tabular-nums">
                {leg.mark != null ? `$${leg.mark.toFixed(2)}` : "-"}
              </td>
              <td
                className={`p-2 font-mono tabular-nums ${
                  leg.unrealizedPnL != null
                    ? leg.unrealizedPnL >= 0
                      ? "text-up"
                      : "text-down"
                    : ""
                }`}
              >
                {leg.unrealizedPnL != null ? `$${leg.unrealizedPnL.toFixed(2)}` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {expanded && (
        <div>
          {detailLoading ? (
            <p className="text-text-dim mt-3">Loading stats...</p>
          ) : detailError ? (
            <p className="text-down mt-3">{detailError}</p>
          ) : detail?.payoff ? (
            <PayoffStats payoff={detail.payoff} />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function LegsPage() {
  const [underlying, setUnderlying] = useState("AAPL");
  const [chain, setChain] = useState<Chain | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState("");

  const [expiry, setExpiry] = useState("");
  const [contractSymbol, setContractSymbol] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [quantity, setQuantity] = useState(1);

  const [legs, setLegs] = useState<StagedLeg[]>([]);
  const [label, setLabel] = useState("");

  const [preview, setPreview] = useState<PayoffPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [structures, setStructures] = useState<Structure[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(true);
  const [structuresError, setStructuresError] = useState("");
  const [actionError, setActionError] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailById, setDetailById] = useState<Record<number, Structure>>({});
  const [detailLoadingById, setDetailLoadingById] = useState<Record<number, boolean>>({});
  const [detailErrorById, setDetailErrorById] = useState<Record<number, string>>({});
  const [closingId, setClosingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChain() {
      setChainLoading(true);
      setChainError("");
      try {
        const res = await api.get(`/options/${underlying}/chain`);
        if (cancelled) return;
        const data: Chain = res.data;
        const expiries = Array.from(new Set(data.rows.map((r) => r.expiry))).sort();
        setChain(data);
        setExpiry(expiries[0] ?? "");
        setContractSymbol("");
      } catch (err) {
        if (cancelled) return;
        setChain(null);
        setChainError(
          (err as AxiosError).response?.status === 502
            ? "The pricing engine is not responding. Start the engine, then refresh."
            : "Could not load the chain. Refresh to try again.",
        );
      } finally {
        if (!cancelled) setChainLoading(false);
      }
    }

    loadChain();
    return () => {
      cancelled = true;
    };
  }, [underlying]);

  useEffect(() => {
    async function load() {
      setStructuresLoading(true);
      setStructuresError("");
      try {
        setStructures(await fetchStructuresList());
      } catch {
        setStructuresError("Could not load structures. Refresh to try again.");
      } finally {
        setStructuresLoading(false);
      }
    }
    load();
  }, []);

  const expiries = chain ? Array.from(new Set(chain.rows.map((r) => r.expiry))).sort() : [];
  const contractRows = chain
    ? chain.rows
        .filter((r) => r.expiry === expiry)
        .sort((a, b) => (a.type === b.type ? a.strike - b.strike : a.type.localeCompare(b.type)))
    : [];

  const handleUnderlyingChange = (u: string) => setUnderlying(u);

  const handleExpiryChange = (value: string) => {
    setExpiry(value);
    setContractSymbol("");
  };

  const handleAddLeg = () => {
    if (!chain) return;
    const row = chain.rows.find((r) => r.symbol === contractSymbol);
    if (!row) return;
    setLegs((prev) => [...prev, { row, direction, quantity }]);
    setQuantity(1);
  };

  const handleRemoveLeg = (index: number) => {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await api.post("/options/payoff", {
        legs: legs.map((l) => ({
          occSymbol: l.row.symbol,
          direction: l.direction,
          quantity: l.quantity,
        })),
      });
      setPreview(res.data);
    } catch (err) {
      setPreview(null);
      setPreviewError(structureErrorMessage(err as AxiosError<{ error: string }>));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenStructure = async () => {
    setSubmitLoading(true);
    setSubmitError("");
    try {
      await api.post("/options/structures", {
        legs: legs.map((l) => ({
          occSymbol: l.row.symbol,
          direction: l.direction,
          quantity: l.quantity,
        })),
        ...(label ? { label } : {}),
      });
    } catch (err) {
      setSubmitError(structureErrorMessage(err as AxiosError<{ error: string }>));
      setSubmitLoading(false);
      return;
    }

    setLegs([]);
    setLabel("");
    setPreview(null);

    try {
      setStructures(await fetchStructuresList());
    } catch {
      setSubmitError("Structure opened, but the list could not be refreshed. Refresh to see it.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (detailById[id]) return;

    setDetailLoadingById((prev) => ({ ...prev, [id]: true }));
    setDetailErrorById((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await api.get(`/options/structures/${id}`);
      setDetailById((prev) => ({ ...prev, [id]: res.data }));
    } catch (err) {
      setDetailErrorById((prev) => ({
        ...prev,
        [id]: structureErrorMessage(err as AxiosError<{ error: string }>),
      }));
    } finally {
      setDetailLoadingById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCloseStructure = async (id: number) => {
    setClosingId(id);
    setActionError("");
    try {
      await api.post(`/options/structures/${id}/close`);
    } catch (err) {
      setActionError(structureErrorMessage(err as AxiosError<{ error: string }>));
      setClosingId(null);
      return;
    }

    setDetailById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDetailErrorById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      setStructures(await fetchStructuresList());
    } catch {
      setActionError("Structure closed, but the list could not be refreshed. Refresh to see it.");
    } finally {
      setClosingId(null);
    }
  };

  const canSubmit = legs.length > 0 && !previewLoading && !submitLoading;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Multi-leg structures</h1>

      <h2 className="text-lg font-semibold mb-3">Leg builder</h2>

      <div className="flex gap-2 mb-3 items-center">
        {UNIVERSE.map((u) => (
          <button
            key={u}
            onClick={() => handleUnderlyingChange(u)}
            disabled={u === underlying || legs.length > 0}
            className={secondaryButtonClass}
          >
            {u}
          </button>
        ))}
      </div>
      {legs.length > 0 && (
        <p className="text-sm text-text-dim mb-6">
          Underlying is locked to {underlying} while legs are staged. Remove all legs to change
          it.
        </p>
      )}

      {chainLoading && <p className="text-text-dim mb-6">Loading chain...</p>}
      {chainError && <p className="text-down mb-6">{chainError}</p>}

      {chain && !chainLoading && !chainError && (
        <div className="flex gap-4 mb-8 items-end flex-wrap">
          <div>
            <label className="block text-sm text-text-dim mb-1">Expiry</label>
            <select value={expiry} onChange={(e) => handleExpiryChange(e.target.value)} className={controlClass}>
              {expiries.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-dim mb-1">Contract</label>
            <select
              value={contractSymbol}
              onChange={(e) => setContractSymbol(e.target.value)}
              className={controlClass}
            >
              <option value="">Select a contract</option>
              {contractRows.map((r) => (
                <option key={r.symbol} value={r.symbol}>
                  {r.type} ${r.strike} bid {r.bid} ask {r.ask}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDirection("LONG")}
              disabled={direction === "LONG"}
              className={secondaryButtonClass}
            >
              Long
            </button>
            <button
              onClick={() => setDirection("SHORT")}
              disabled={direction === "SHORT"}
              className={secondaryButtonClass}
            >
              Short
            </button>
          </div>

          <div>
            <label className="block text-sm text-text-dim mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.trunc(Number(e.target.value))))}
              className={`${controlClass} w-24 font-mono tabular-nums`}
            />
          </div>

          <button onClick={handleAddLeg} disabled={!contractSymbol} className={secondaryButtonClass}>
            Add leg
          </button>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Staged legs</h2>
      {legs.length === 0 ? (
        <p className="text-text-dim mb-12">No legs staged yet. Add a contract above.</p>
      ) : (
        <div className="clearing p-4 mb-12">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-text-dim">
                <th className="p-2 font-normal">Contract</th>
                <th className="p-2 font-normal">Type</th>
                <th className="p-2 font-normal">Strike</th>
                <th className="p-2 font-normal">Expiry</th>
                <th className="p-2 font-normal">Direction</th>
                <th className="p-2 font-normal">Quantity</th>
                <th className="p-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {legs.map((l, i) => (
                <tr key={`${l.row.symbol}-${i}`} className="border-b border-hairline hover:bg-panel-2">
                  <td className="p-2 font-mono text-xs tabular-nums">{l.row.symbol}</td>
                  <td className="p-2">{l.row.type}</td>
                  <td className="p-2 font-mono tabular-nums">${l.row.strike}</td>
                  <td className="p-2 font-mono tabular-nums">{l.row.expiry}</td>
                  <td className="p-2">{l.direction}</td>
                  <td className="p-2 font-mono tabular-nums">{l.quantity}</td>
                  <td className="p-2">
                    <button onClick={() => handleRemoveLeg(i)} className={secondaryButtonClass}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Preview & submit</h2>
      <div className="mb-4">
        <label className="block text-sm text-text-dim mb-1">Label (optional)</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={controlClass} />
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={handlePreview} disabled={!canSubmit} className={secondaryButtonClass}>
          Preview payoff
        </button>
        <button onClick={handleOpenStructure} disabled={!canSubmit} className={primaryButtonClass}>
          Open structure
        </button>
      </div>

      {previewLoading && <p className="text-text-dim mb-3">Pricing preview...</p>}
      {previewError && <p className="text-down mb-3">{previewError}</p>}
      {submitError && <p className="text-down mb-3">{submitError}</p>}
      {preview && <PayoffStats payoff={preview.payoff} />}

      <h2 className="text-lg font-semibold mb-3 mt-12">Open structures</h2>
      {actionError && <p className="text-down mb-3">{actionError}</p>}
      {structuresLoading ? (
        <p className="text-text-dim">Loading...</p>
      ) : structuresError ? (
        <p className="text-down">{structuresError}</p>
      ) : structures.length === 0 ? (
        <p className="text-text-dim">No open structures yet. Build one above and open it to see it here.</p>
      ) : (
        <div className="clearing p-4">
          {structures.map((s, idx) => (
            <div key={s.id} className={idx === 0 ? "" : "mt-6 pt-6 border-t border-hairline"}>
              <StructureCard
                structure={s}
                expanded={expandedId === s.id}
                detail={detailById[s.id]}
                detailLoading={detailLoadingById[s.id] ?? false}
                detailError={detailErrorById[s.id] ?? ""}
                closing={closingId === s.id}
                onToggleExpand={() => handleToggleExpand(s.id)}
                onClose={() => handleCloseStructure(s.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
