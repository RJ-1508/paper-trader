"use client";
import { Fragment, useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import type { OptionEvent, OptionPosition } from "@/lib/options";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "ALL", label: "All" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "EXERCISED", label: "Exercised" },
  { value: "ASSIGNED", label: "Assigned" },
];

function emptyMessage(status: string): string {
  if (status === "OPEN") return "No open positions — open one from the chain.";
  if (status === "ALL") return "No option positions yet — open one from the chain.";
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return `No ${label.toLowerCase()} positions.`;
}

type PositionGroup = { structureId: number | null; legs: OptionPosition[] };

function groupPositions(positions: OptionPosition[]): PositionGroup[] {
  const groups: PositionGroup[] = [];
  const byStructureId = new Map<number, PositionGroup>();
  for (const p of positions) {
    if (p.structureId == null) {
      groups.push({ structureId: null, legs: [p] });
      continue;
    }
    const existing = byStructureId.get(p.structureId);
    if (existing) {
      existing.legs.push(p);
    } else {
      const group: PositionGroup = { structureId: p.structureId, legs: [p] };
      byStructureId.set(p.structureId, group);
      groups.push(group);
    }
  }
  return groups;
}

function HistoryRow({ position }: { position: OptionPosition }) {
  const [events, setEvents] = useState<OptionEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/options/positions/${position.id}/events`);
        if (cancelled) return;
        setEvents(res.data);
      } catch {
        if (cancelled) return;
        setError("Could not load the event history. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [position.id]);

  if (loading) return <p className="p-2 text-sm text-text-dim">Loading history...</p>;
  if (error) return <p className="p-2 text-sm text-down">{error}</p>;
  if (!events || events.length === 0) {
    return <p className="p-2 text-sm text-text-faint">No events for this position yet.</p>;
  }

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-hairline text-left text-text-faint">
          <th className="p-2 font-normal">Type</th>
          <th className="p-2 font-normal">Quantity</th>
          <th className="p-2 font-normal">Price</th>
          <th className="p-2 font-normal">Cash effect</th>
          <th className="p-2 font-normal">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id} className="border-b border-hairline">
            <td className="p-2">{e.type}</td>
            <td className="p-2 font-mono tabular-nums">{e.quantity}</td>
            <td className="p-2 font-mono tabular-nums">{e.price != null ? `$${Number(e.price).toFixed(2)}` : "-"}</td>
            <td className="p-2 font-mono tabular-nums">${Number(e.cashEffect).toFixed(2)}</td>
            <td className="p-2 font-mono tabular-nums">{new Date(e.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function OptionsPositionsPage() {
  const [status, setStatus] = useState("OPEN");
  const [positions, setPositions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/options/positions", { params: { status } });
        if (cancelled) return;
        setPositions(res.data);
      } catch {
        if (cancelled) return;
        setError("Could not load positions. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, reloadToken]);

  const handleClose = async (position: OptionPosition) => {
    setActionError("");
    try {
      await api.post(`/options/positions/${position.id}/close`, {
        occSymbol: position.occSymbol,
        direction: position.direction,
      });
      setReloadToken((t) => t + 1);
    } catch (err) {
      const message = (err as AxiosError<{ error: string }>).response?.data?.error;
      if (message === "No open position found") {
        setActionError("This position is no longer open.");
      } else if (message === "No market price available for contract") {
        setActionError("No market price for this contract right now. Try again shortly.");
      } else if (message === "Position belongs to a structure; close the structure instead") {
        setActionError("This position belongs to a structure; close the structure instead from the Multi-leg tab.");
      } else {
        setActionError("Could not close the position. Try again.");
      }
    }
  };

  const handleExercise = async (position: OptionPosition) => {
    setActionError("");
    try {
      await api.post(`/options/positions/${position.id}/exercise`);
      setReloadToken((t) => t + 1);
    } catch (err) {
      const message = (err as AxiosError<{ error: string }>).response?.data?.error;
      if (message === "No exercisable position found") {
        setActionError("This position is no longer exercisable.");
      } else {
        setActionError("Could not exercise the position. Try again.");
      }
    }
  };

  const handleToggleHistory = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Positions</h1>

      <div className="mb-6">
        <label className="block text-sm text-text-dim mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-panel-2 border border-hairline rounded-control px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-text-dim">Loading...</p>}
      {error && <p className="text-down">{error}</p>}
      {actionError && <p className="text-down mb-2">{actionError}</p>}

      {!loading && !error && positions.length === 0 && (
        <p className="text-text-faint">{emptyMessage(status)}</p>
      )}

      {!loading && !error && positions.length > 0 && (
        <div className="clearing p-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-text-dim">
                <th className="p-2 font-normal">Underlying</th>
                <th className="p-2 font-normal">Contract</th>
                <th className="p-2 font-normal">Type</th>
                <th className="p-2 font-normal">Direction</th>
                <th className="p-2 font-normal">Quantity</th>
                <th className="p-2 font-normal">Strike</th>
                <th className="p-2 font-normal">Expiry</th>
                <th className="p-2 font-normal">Open premium</th>
                <th className="p-2 font-normal">Mark</th>
                <th className="p-2 font-normal">Unrealized P&L</th>
                <th className="p-2 font-normal">Realized P&L</th>
                <th className="p-2 font-normal">Status</th>
                <th className="p-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupPositions(positions).map((group) => (
                <Fragment key={group.structureId ?? `p${group.legs[0].id}`}>
                  {group.structureId != null && (
                    <tr className="border-b border-hairline bg-panel-2">
                      <td className="p-2 text-xs font-medium text-silver-dim" colSpan={13}>
                        {`Structure ${group.structureId} — ${group.legs.length} legs on ${group.legs[0].underlying} · see Multi-leg tab for structure detail and closing`}
                      </td>
                    </tr>
                  )}
                  {group.legs.map((p) => {
                    const canClose = p.status === "OPEN";
                    const canExercise = p.status === "OPEN" && p.direction === "LONG";
                    const isExpanded = expandedId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr className="border-b border-hairline hover:bg-panel-2">
                          <td className="p-2">{p.underlying}</td>
                          <td className="p-2 font-mono tabular-nums text-xs">{p.occSymbol}</td>
                          <td className="p-2">{p.optionType}</td>
                          <td className="p-2">{p.direction}</td>
                          <td className="p-2 font-mono tabular-nums">{p.quantity}</td>
                          <td className="p-2 font-mono tabular-nums">${Number(p.strike).toFixed(2)}</td>
                          <td className="p-2 font-mono tabular-nums">{p.expiry}</td>
                          <td className="p-2 font-mono tabular-nums">${Number(p.openPremium).toFixed(2)}</td>
                          <td className="p-2 font-mono tabular-nums">{p.mark != null ? `$${p.mark.toFixed(2)}` : "-"}</td>
                          <td
                            className={`p-2 font-mono tabular-nums ${
                              p.unrealizedPnL != null
                                ? p.unrealizedPnL >= 0
                                  ? "text-up"
                                  : "text-down"
                                : ""
                            }`}
                          >
                            {p.unrealizedPnL != null ? `$${p.unrealizedPnL.toFixed(2)}` : "-"}
                          </td>
                          <td
                            className={`p-2 font-mono tabular-nums ${
                              p.realizedPnL != null
                                ? Number(p.realizedPnL) >= 0
                                  ? "text-up"
                                  : "text-down"
                                : ""
                            }`}
                          >
                            {p.realizedPnL != null ? `$${Number(p.realizedPnL).toFixed(2)}` : "-"}
                          </td>
                          <td className="p-2">{p.status}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              {canClose && (
                                <button
                                  onClick={() => handleClose(p)}
                                  className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-3 py-2 transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                                >
                                  Close position
                                </button>
                              )}
                              {canExercise && (
                                <button
                                  onClick={() => handleExercise(p)}
                                  className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-3 py-2 transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                                >
                                  Exercise
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleHistory(p.id)}
                                className="border border-hairline hover:border-hairline-strong text-text-dim hover:text-text rounded-control px-3 py-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-hairline">
                            <td className="p-2" colSpan={13}>
                              <HistoryRow position={p} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
