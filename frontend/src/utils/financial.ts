/**
 * Safe financial math utilities.
 * ALL arithmetic in this file guards against NaN, Infinity, and division-by-zero.
 * Never return raw JS math results to UI components — always route through these.
 */

/** Safely parse a number that might be undefined, null or NaN */
export function safeNum(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return value;
}

/** Division that returns fallback when denominator is zero or NaN */
export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  fallback = 0
): number {
  const n = safeNum(numerator);
  const d = safeNum(denominator);
  if (d === 0) return fallback;
  const result = n / d;
  return Number.isFinite(result) ? result : fallback;
}

/** Format a USD financial value, e.g. "$12,345.67" */
export function formatUSD(
  value: number | null | undefined,
  opts: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const n = safeNum(value);
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
  })}`;
}

/** Format a percentage from a decimal ratio, e.g. 0.152 → "+15.20%" */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2,
  showSign = false
): string {
  const n = safeNum(value);
  const sign = showSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

/** Return ROE% string: unrealizedPnl / margin × 100 */
export function calcROE(
  unrealizedPnl: number | null | undefined,
  margin: number | null | undefined
): string {
  const ratio = safeDivide(unrealizedPnl, margin) * 100;
  const sign = ratio >= 0 ? '+' : '';
  return `${sign}${ratio.toFixed(2)}%`;
}

/** Risk level bucket: 0–40% → Healthy, 40–75% → Warning, >75% → Critical */
export function riskLevel(usedMargin: number, totalEquity: number): 'healthy' | 'warning' | 'critical' | 'none' {
  if (totalEquity <= 0) return 'none';
  const pct = safeDivide(usedMargin, totalEquity) * 100;
  if (pct >= 75) return 'critical';
  if (pct >= 40) return 'warning';
  return 'healthy';
}

/** Short volume label: 1_234_567 → "$1.23M", 345_000 → "$345.0K" */
export function formatVolume(value: number | null | undefined): string {
  const n = safeNum(value);
  if (n === 0) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

/** Liquidation distance as a percentage from mark price */
export function calcLiqDistance(
  markPrice: number | null | undefined,
  liquidationPrice: number | null | undefined
): string {
  const mark = safeNum(markPrice);
  const liq = safeNum(liquidationPrice);
  if (mark <= 0 || liq <= 0) return '—';
  const dist = Math.abs(safeDivide(mark - liq, mark) * 100);
  return `${dist.toFixed(2)}%`;
}

/** Mark price formatted with dynamic precision based on magnitude */
export function formatPrice(value: number | null | undefined): string {
  const n = safeNum(value);
  if (n === 0) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

/** Funding rate formatted as basis points */
export function formatFundingRate(value: number | null | undefined): string {
  const n = safeNum(value);
  if (n === 0) return '—';
  const bps = (n * 100).toFixed(4);
  return `${n >= 0 ? '+' : ''}${bps}%`;
}
