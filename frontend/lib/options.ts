export type ChainRow = {
  symbol: string;
  strike: number;
  type: "call" | "put";
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

export type Chain = {
  underlying: string;
  spot: number;
  rows: ChainRow[];
};

export type PositionStatus = "OPEN" | "CLOSED" | "EXPIRED" | "EXERCISED" | "ASSIGNED";

// Prisma Decimal columns arrive over JSON as strings; wrap in Number() before arithmetic or toFixed().
export type OptionPosition = {
  id: number;
  portfolioId: number;
  underlying: string;
  optionType: "CALL" | "PUT";
  strike: string;
  expiry: string;
  occSymbol: string;
  multiplier: number;
  direction: "LONG" | "SHORT";
  quantity: number;
  openPremium: string;
  collateralCash: string;
  reservedShares: number;
  status: PositionStatus;
  closePremium: string | null;
  realizedPnL: string | null;
  structureId: number | null;
  openedAt: string;
  closedAt: string | null;
  mark: number | null;
  unrealizedPnL: number | null;
};

export type OptionEvent = {
  id: number;
  positionId: number;
  type: "OPEN" | "CLOSE" | "EXPIRE" | "EXERCISE" | "ASSIGN";
  quantity: number;
  price: string | null;
  cashEffect: string;
  createdAt: string;
};

export type Greeks = {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};

export type NetGreeks = {
  net: Greeks;
  byUnderlying: Record<string, Greeks & { spot: number }>;
  asOf: string;
};

export type ScenarioResult = {
  net: Greeks;
  scenario: {
    mode: "approx" | "exact";
    dSpotPct: number;
    dVolPts: number;
    dDays: number;
    total: number;
    breakdown?: { deltaPnl: number; gammaPnl: number; vegaPnl: number; thetaPnl: number };
  };
};

export type Payoff = {
  spot: number;
  range: { low: number; high: number; points: number };
  curve: { S: number; payoff: number }[];
  breakevens: number[];
  maxProfit: number | null;
  maxLoss: number | null;
  unbounded: { upside: boolean; downside: boolean };
  netDebitCredit: number;
  expiry: string;
  mixedExpiries: boolean;
};

export type Structure = {
  id: number;
  portfolioId: number;
  label: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  realizedPnL: string | null;
  legs: OptionPosition[];
  unrealizedPnL: number;
  netDebitCredit: number;
  payoff?: Payoff;
};

export const UNIVERSE = ["SPY", "AAPL", "MSFT", "NVDA", "TSLA"];
