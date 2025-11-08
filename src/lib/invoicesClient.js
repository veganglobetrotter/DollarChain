// src/lib/invoicesClient.js
// Lightweight invoices API client (Supabase) with Wallet Credit helpers

import { supabase } from "./supabase";
import axios from "axios"; // for calling serverless credit endpoints

const BUCKET = "invoices";

/**
 * fetchInvoices, fetchInvoiceById, downloadInvoicePdf, deleteInvoice, markInvoicePaid
 * (existing functions unchanged)
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
    let query = supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .order(orderBy, { ascending: order === "asc" });

    if (userId) query = query.eq("user_id", userId);
    if (status) query = query.eq("status", status);

    if (q && q.trim()) {
      const esc = q.trim().replace(/%/g, "\\%");
      query = query.or(
        `buyer_name.ilike.%${esc}%,payment_number.ilike.%${esc}%`,
        { foreignTable: undefined }
      );
    }

    if (from) {
      const fromIso = from instanceof Date ? from.toISOString() : from;
      query = query.gte("created_at", fromIso);
    }
    if (to) {
      const toIso = to instanceof Date ? to.toISOString() : to;
      query = query.lte("created_at", toIso);
    }

    const fromIndex = offset;
    const toIndex = Math.max(offset + limit - 1, offset);

    const resp = await query.range(fromIndex, toIndex);
    const { data, error, count } = resp;
    if (error) return { data: [], count: null, error };
    return { data: data || [], count: typeof count === "number" ? count : null, error: null };
  } catch (err) {
    return { data: [], count: null, error: err };
  }
}

export async function fetchInvoiceById(id) {
  if (!id) return { data: null, error: new Error("id is required") };
  try {
    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    return { data: data ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function downloadInvoicePdf(path, options = {}) {
  const { expiresSeconds = 60 } = options;
  if (!path) return { url: null, blob: null, error: new Error("path is required") };

  try {
    if (typeof supabase.storage?.from === "function" && typeof supabase.storage.from(BUCKET).createSignedUrl === "function") {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresSeconds);
        if (!error && data?.signedUrl) return { url: data.signedUrl, blob: null, error: null };
      } catch (err) {}
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) return { url: null, blob: null, error };
    return { url: null, blob: data, error: null };
  } catch (err) {
    return { url: null, blob: null, error: err };
  }
}

export async function deleteInvoice(id) {
  if (!id) return { data: null, error: new Error("id is required") };
  try {
    const { data, error } = await supabase.from("invoices").delete().eq("id", id).select().maybeSingle();
    return { data: data ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

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

/* ----------------- Wallet Credit API Helpers ----------------- */
/**
 * reserveCredits
 * - Reserves credits for a user
 * - Returns: { reservation: { id, amount }, error }
 */
export async function reserveCredits(userId, amount) {
  if (!userId || !amount) throw new Error("userId and amount are required");
  try {
    const res = await axios.post("/api/reserveCredits", { userId, amount });
    return res.data;
  } catch (err) {
    console.error("reserveCredits error:", err);
    return { reservation: null, error: err };
  }
}

/**
 * consumeCredits
 * - Consumes reserved credits
 * - reservationId: required to tie consumption
 * - Returns: { success: boolean, error }
 */
export async function consumeCredits(userId, reservationId, delta, reference) {
  if (!userId || !reservationId || !delta) throw new Error("userId, reservationId, and delta required");
  try {
    const res = await axios.post("/api/consumeCredits", { userId, reservationId, delta, reference });
    return res.data;
  } catch (err) {
    console.error("consumeCredits error:", err);
    return { success: false, error: err };
  }
}

/**
 * releaseCredits
 * - Releases reserved credits without consuming
 * - reservationId required
 * - Returns: { success: boolean, error }
 */
export async function releaseCredits(userId, reservationId) {
  if (!userId || !reservationId) throw new Error("userId and reservationId required");
  try {
    const res = await axios.post("/api/releaseCredits", { userId, reservationId });
    return res.data;
  } catch (err) {
    console.error("releaseCredits error:", err);
    return { success: false, error: err };
  }
}

/* ----------------- Default Export ----------------- */
export default {
  fetchInvoices,
  fetchInvoiceById,
  downloadInvoicePdf,
  deleteInvoice,
  markInvoicePaid,
  reserveCredits,
  consumeCredits,
  releaseCredits,
};
