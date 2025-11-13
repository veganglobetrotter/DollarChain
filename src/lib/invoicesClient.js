// src/lib/invoicesClient.js
// Lightweight invoices API client (Supabase) with Wallet Credit helpers

import { supabase } from "./supabase";
import axios from "axios"; // for calling serverless credit endpoints

const BUCKET = "invoices";

/* ... (unchanged fetchInvoices, fetchInvoiceById, downloadInvoicePdf, deleteInvoice, markInvoicePaid) ... */

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

export async function reserveCredits(userId, amount, idempotencyKey) {
  if (!userId || typeof amount === "undefined" || amount === null) {
    throw new Error("userId and amount are required");
  }

  // generate idempotency key if not provided
  let key = idempotencyKey;
  try {
    if (!key) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        key = crypto.randomUUID();
      } else {
        key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      }
    }
  } catch (e) {
    key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  try {
    const res = await axios.post("/api/reserveCredits", { userId, amount, idempotencyKey: key });

    const payload = res?.data ?? null;
    // server may return many shapes:
    //  - { reservation: {...} }
    //  - { result: {...} }
    //  - { success: true, data: [...] }
    //  - legacy: raw object
    let reservation = payload?.reservation ?? payload?.data ?? payload?.result ?? payload;

    // If server returned an array (e.g. data: [ {...} ]), prefer the first entry
    if (Array.isArray(reservation) && reservation.length > 0) {
      reservation = reservation[0];
    }

    return { reservation, error: null };
  } catch (err) {
    console.error("reserveCredits error:", err);
    const serverMessage = err?.response?.data ?? err?.message ?? err;
    return { reservation: null, error: serverMessage };
  }
}

export async function consumeCredits(userId, reservationId, delta, type, reference) {
  if (!userId || !reservationId || typeof delta === "undefined" || !type) {
    throw new Error("userId, reservationId, delta and type are required");
  }

  try {
    const res = await axios.post("/api/consumeCredits", {
      userId,
      reservationId,
      delta,
      type,
      reference: reference ?? null,
    });

    const payload = res?.data ?? null;
    // server returns various shapes: prefer result, transaction, data, then payload itself
    let transaction = payload?.result ?? payload?.transaction ?? payload?.data ?? payload;

    // If it's an array, pick the first entry (common when returning rows)
    if (Array.isArray(transaction) && transaction.length > 0) {
      transaction = transaction[0];
    }

    return { transaction, error: null };
  } catch (err) {
    console.error("consumeCredits error:", err);
    const serverMessage = err?.response?.data ?? err?.message ?? err;
    return { transaction: null, error: serverMessage };
  }
}

export async function releaseCredits(userId, reservationId) {
  if (!userId || !reservationId) throw new Error("userId and reservationId required");

  try {
    const res = await axios.post("/api/releaseCredits", { userId, reservationId });

    const payload = res?.data ?? null;
    // server may return result/reservation/data
    let reservation = payload?.result ?? payload?.reservation ?? payload?.data ?? payload;

    if (Array.isArray(reservation) && reservation.length > 0) {
      reservation = reservation[0];
    }

    return { reservation, error: null };
  } catch (err) {
    console.error("releaseCredits error:", err);
    const serverMessage = err?.response?.data ?? err?.message ?? err;
    return { reservation: null, error: serverMessage };
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
