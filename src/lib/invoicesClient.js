// src/lib/invoicesClient.js
// Lightweight invoices API client (Supabase)
// Step 1 for Invoices feature in DollarChain.
//
// NOTE: adjust BUCKET if your storage bucket has another name.

import { supabase } from "./supabase";

/**
 * Configuration
 * Update BUCKET if your storage bucket name differs.
 */
const BUCKET = "invoices";

/**
 * fetchInvoices
 * - supports pagination (limit / offset)
 * - supports simple text search (buyer_name, payment_number)
 * - supports status filter and date range (created_at)
 *
 * Returns: { data: Array, count: number|null, error: Error|null }
 *
 * Options:
 *  {
 *    limit: number,        // page size
 *    offset: number,       // zero-based offset
 *    q: string,            // text search
 *    status: string,       // invoice status (e.g. 'pending', 'paid')
 *    from: string|Date,    // created_at >= from (ISO string ok)
 *    to: string|Date,      // created_at <= to
 *    userId: string,       // filter by user_id
 *    orderBy: string,      // column to order by
 *    order: 'asc'|'desc'
 *  }
 */
export async function fetchInvoices(opts = {}) {
  const {
    limit = 20,
    offset = 0,
    q,
    status,
    from,
    to,
    userId,
    orderBy = "created_at",
    order = "desc",
  } = opts || {};

  try {
    // Build base select. We request an exact count for pagination.
    let query = supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .order(orderBy, { ascending: order === "asc" });

    // Filters
    if (userId) query = query.eq("user_id", userId);
    if (status) query = query.eq("status", status);

    if (q && q.trim()) {
      const esc = q.trim().replace(/%/g, "\\%"); // basic escape for %
      // search buyer_name or payment_number (case-insensitive)
      // Supabase 'or' expects a comma separated list of conditions
      query = query.or(
        `buyer_name.ilike.%${esc}%,payment_number.ilike.%${esc}%`,
        { foreignTable: undefined }
      );
    }

    if (from) {
      // If Date object, convert to ISO string
      const fromIso = from instanceof Date ? from.toISOString() : from;
      query = query.gte("created_at", fromIso);
    }
    if (to) {
      const toIso = to instanceof Date ? to.toISOString() : to;
      query = query.lte("created_at", toIso);
    }

    // Range for pagination (Supabase uses inclusive range)
    const fromIndex = offset;
    const toIndex = Math.max(offset + limit - 1, offset);

    const resp = await query.range(fromIndex, toIndex);

    const { data, error, count } = resp;
    if (error) {
      return { data: [], count: null, error };
    }
    return { data: data || [], count: typeof count === "number" ? count : null, error: null };
  } catch (err) {
    return { data: [], count: null, error: err };
  }
}

/**
 * fetchInvoiceById
 * - returns an invoice object or null
 * - returns shape: { data: invoice|null, error }
 */
export async function fetchInvoiceById(id) {
  if (!id) return { data: null, error: new Error("id is required") };
  try {
    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    return { data: data ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * downloadInvoicePdf
 * - Try to create a temporary signed URL (recommended), fallback to download blob
 * - param path: the storage path used when uploading (string)
 * - options: { expiresSeconds } default 60 seconds for signed url
 *
 * Returns:
 *  { url: string|null, blob: Blob|null, error: Error|null }
 *
 * If url is returned you can link to it directly in the UI to download.
 * If blob is returned you can createObjectURL(blob) or trigger a download.
 */
export async function downloadInvoicePdf(path, options = {}) {
  const { expiresSeconds = 60 } = options;
  if (!path) return { url: null, blob: null, error: new Error("path is required") };

  try {
    // Attempt to create a signed URL first (best UX for frontend)
    // Note: createSignedUrl returns { data: { signedUrl }, error }
    if (typeof supabase.storage?.from === "function" && typeof supabase.storage.from(BUCKET).createSignedUrl === "function") {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresSeconds);
        if (!error && data?.signedUrl) {
          return { url: data.signedUrl, blob: null, error: null };
        }
        // fallthrough to download blob if signed url fails
      } catch (err) {
        // continue to fallback
      }
    }

    // Fallback: download raw blob
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) return { url: null, blob: null, error };
    return { url: null, blob: data, error: null };
  } catch (err) {
    return { url: null, blob: null, error: err };
  }
}

/**
 * deleteInvoice
 * - deletes DB row
 * - does NOT delete the associated storage object (optional)
 *
 * Returns { data, error }
 */
export async function deleteInvoice(id) {
  if (!id) return { data: null, error: new Error("id is required") };
  try {
    const { data, error } = await supabase.from("invoices").delete().eq("id", id).select().maybeSingle();
    return { data: data ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * markInvoicePaid
 * - convenience helper to set status to 'paid'
 * - you can pass additional update fields via `extra = { }`
 *
 * Returns { data, error }
 */
export async function markInvoicePaid(id, extra = {}) {
  if (!id) return { data: null, error: new Error("id is required") };
  try {
    const payload = { status: "paid", ...extra };
    const { data, error } = await supabase.from("invoices").update(payload).eq("id", id).select().maybeSingle();
    return { data: data ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

// default export for convenience
export default {
  fetchInvoices,
  fetchInvoiceById,
  downloadInvoicePdf,
  deleteInvoice,
  markInvoicePaid,
};
