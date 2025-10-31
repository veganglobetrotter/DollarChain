// src/lib/storage.js
import { supabase } from "./supabase";

/**
 * uploadInvoicePdf(userId, invoiceId, blob)
 * returns { path, error, data }
 */
export async function uploadInvoicePdf(userId, invoiceId, blob) {
  try {
    const path = `${userId}/${invoiceId}.pdf`;
    // Supabase expects either File or Blob; blob is fine.
    const { data, error } = await supabase.storage.from("invoices").upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) throw error;
    return { path, data, error: null };
  } catch (err) {
    console.error("uploadInvoicePdf error:", err);
    return { path: null, data: null, error: err };
  }
}

/**
 * createSignedUrl(path, expires) -> returns { url, error }
 */
export async function createSignedUrl(path, expires = 60 * 60) { // expires in seconds (default 1 hour)
  try {
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(path, expires);
    if (error) throw error;
    return { url: data.signedUrl, error: null };
  } catch (err) {
    console.error("createSignedUrl error:", err);
    return { url: null, error: err };
  }
}
