// src/lib/storage.js
import { supabase } from "./supabase";

const INVOICES_BUCKET = "invoices"; // must match bucket name exactly

export async function uploadInvoicePdf(userId, invoiceId, blob) {
  try {
    const path = `${userId}/${invoiceId}.pdf`;
    console.log("[storage] attempt upload ->", { bucket: INVOICES_BUCKET, path, size: blob?.size });

    // Call supabase.storage.upload and capture full response
    const res = await supabase.storage.from(INVOICES_BUCKET).upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });

    // Log full response for debugging
    console.log("[storage] upload response:", res);

    // Supabase client returns { data, error }
    if (res?.error) {
      console.error("[storage] upload returned error object:", res.error);
      return { path: null, data: null, error: res.error };
    }

    return { path, data: res.data, error: null };
  } catch (err) {
    // Very verbose logging for debugging
    console.error("uploadInvoicePdf error:", err);
    if (err?.response) {
      try {
        const text = await err.response.text();
        console.error("upload response body:", text);
      } catch (e) {
        console.warn("could not read err.response body", e);
      }
    }
    return { path: null, data: null, error: err };
  }
}

export async function createSignedUrl(path, expires = 60 * 60) {
  try {
    const { data, error } = await supabase.storage.from(INVOICES_BUCKET).createSignedUrl(path, expires);
    if (error) {
      console.error("[storage] createSignedUrl error:", error);
      return { url: null, error };
    }
    return { url: data.signedUrl, error: null };
  } catch (err) {
    console.error("createSignedUrl error:", err);
    return { url: null, error: err };
  }
}
