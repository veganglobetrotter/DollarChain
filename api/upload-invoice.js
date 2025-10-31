// api/upload-invoice.js
import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const invoiceId = Array.isArray(fields.invoiceId) ? fields.invoiceId[0] : fields.invoiceId;
    const file = Array.isArray(files?.file) ? files.file[0] : files?.file;
    if (!file || !invoiceId) return res.status(400).json({ error: "Missing file or invoiceId" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization bearer token" });

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const BUCKET = process.env.SUPABASE_BUCKET || process.env.VITE_SUPABASE_BUCKET || "invoices";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server misconfigured: missing supabase url or service role key" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // verify token & get user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: "Invalid user token", detail: userErr?.message });
    const userId = userData.user.id;

    // verify invoice ownership
    const { data: invRow, error: invErr } = await supabaseAdmin.from("invoices").select("id,user_id").eq("id", invoiceId).maybeSingle();
    if (invErr) throw invErr;
    if (!invRow) return res.status(404).json({ error: "Invoice not found" });
    if (invRow.user_id !== userId) return res.status(403).json({ error: "You do not own this invoice" });

    // read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    const path = `${userId}/${invoiceId}.pdf`;
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadErr) return res.status(500).json({ error: "Storage upload failed", detail: uploadErr.message });

    // update pdf_path in DB (service role bypasses RLS)
    const { error: updateErr } = await supabaseAdmin.from("invoices").update({ pdf_path: path }).eq("id", invoiceId);
    if (updateErr) return res.status(500).json({ error: "Failed to attach pdf_path", detail: updateErr.message });

    // create signed url for convenience
    const { data: signedData, error: signedErr } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
    if (signedErr) console.warn("Signed URL warning", signedErr);

    return res.json({ success: true, path, signedUrl: signedData?.signedUrl || null });
  } catch (err) {
    console.error("Upload endpoint error:", err);
    return res.status(500).json({ error: "Server error", detail: err?.message || String(err) });
  }
}
