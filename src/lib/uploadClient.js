// src/lib/uploadClient.js
import { supabase } from "./supabase";

/**
 * uploadInvoicePdfToServer(invoiceId, blob)
 * - Posts the PDF blob to the serverless endpoint /api/upload-invoice
 * - The endpoint must validate the bearer token and perform the upload (service role)
 * Returns server JSON: { success: true, path, signedUrl }
 */
export default async function uploadInvoicePdfToServer(invoiceId, blob) {
  // Get access token from client session
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || sessionData?.access_token;
  if (!token) throw new Error("Not signed in");

  const form = new FormData();
  form.append("invoiceId", invoiceId);
  form.append("file", blob, `${invoiceId}.pdf`);

  const resp = await fetch("/api/upload-invoice", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "unknown" }));
    throw new Error(err?.error || JSON.stringify(err));
  }

  return resp.json(); // { success, path, signedUrl }
}
