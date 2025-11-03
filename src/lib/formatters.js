// src/lib/formatters.js
// Small, robust formatting utilities used across the app (numbers, currency, percent).
// Designed to prefer Intl.NumberFormat when available, with safe fallbacks for older
// runtimes. Intentionally dependency-free.

/**
 * Normalize input to a finite number (returns NaN if not possible)
 * @param {any} v
 * @returns {number}
 */
function toNumber(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Format a plain number with optional locale and fraction digits.
 * - If Intl.NumberFormat is available it will be used.
 * - Returns a string (e.g. "1,234")
 *
 * @param {number|string} value
 * @param {{locale?: string, minimumFractionDigits?: number, maximumFractionDigits?: number}} [opts]
 */
export function formatNumber(value, opts = {}) {
  const { locale, minimumFractionDigits = 0, maximumFractionDigits = 0 } = opts;
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "0";
  try {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      return new Intl.NumberFormat(locale || undefined, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(n);
    }
  } catch (e) {
    // fallthrough to fallback
  }
  // fallback
  return n.toFixed(Math.max(0, minimumFractionDigits)).replace(/\.0+$/, (s) => s);
}

/**
 * Format currency in a safe way. Prefer Intl when available and valid.
 * Falls back to the simple `CODE 1,234` format if Intl fails.
 *
 * Examples:
 *   formatCurrency(1234.5, 'KES') => "KES 1,234.5" (depending on opts)
 *   formatCurrency(1000, 'USD', { useIntl: true }) => "USD 1,000.00"
 *
 * @param {number|string} value
 * @param {string} currencyCode - e.g. 'KES', 'USD'
 * @param {{locale?: string, useIntl?: boolean, minimumFractionDigits?: number, maximumFractionDigits?: number}} [opts]
 */
export function formatCurrency(value, currencyCode = "KES", opts = {}) {
  const {
    locale,
    useIntl = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = opts || {};

  const n = toNumber(value);
  if (!Number.isFinite(n)) return `${currencyCode} 0`;

  if (useIntl && typeof Intl !== "undefined" && Intl.NumberFormat) {
    try {
      // Use currencyDisplay 'code' so we get "KES 1,234" by default.
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "code",
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(n);
    } catch (err) {
      // ignore and fallback
    }
  }

  // fallback: simple CODE + formatted number
  return `${currencyCode} ${formatNumber(n, { locale, minimumFractionDigits, maximumFractionDigits })}`;
}

/**
 * Format a percentage value. Accepts both 0-1 and 0-100 style inputs.
 * Returns a string with percent sign (e.g. "12%" or "12.3%" depending on digits)
 *
 * @param {number|string} value - either 0-1 (0.12) or 0-100 (12)
 * @param {{minimumFractionDigits?: number, maximumFractionDigits?: number, locale?: string}} [opts]
 */
export function formatPercent(value, opts = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0, locale } = opts;
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "0%";

  // If value looks like 0..1 keep it; if >1 assume 0..100 input and divide.
  const normalized = Math.abs(n) <= 1 ? n : n / 100;

  try {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      return new Intl.NumberFormat(locale || undefined, {
        style: "percent",
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(normalized);
    }
  } catch (e) {
    // fallback
  }

  const pct = (normalized * 100).toFixed(Math.max(0, maximumFractionDigits));
  return `${Number(pct)}%`;
}

/**
 * Small helper to gracefully attempt to obtain a locale string from the environment.
 * Client-first (navigator.language) — may return undefined in non-browser runtimes.
 */
export function detectLocale() {
  try {
    if (typeof navigator !== "undefined") return navigator.language || navigator.userLanguage;
  } catch (e) {
    // ignore
  }
  return undefined;
}

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  detectLocale,
};
