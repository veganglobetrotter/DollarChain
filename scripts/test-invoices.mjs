// scripts/test-invoices.mjs
// Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-invoices.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY; // use anon key or service key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  try {
    console.log("Fetching latest 5 invoices...");
    const { data, error, count } = await supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching invoices:", error);
    } else {
      console.log("Received:", data);
      console.log("Count (total rows):", count);
    }

    // If you want to test signed URL generation for a sample pdf_path:
    // Replace 'path/to/invoice.pdf' with a path from one of the invoice rows (pdf_path)
    const samplePath = data && data[0] && data[0].pdf_path ? data[0].pdf_path : null;
    if (samplePath) {
      console.log("Testing signed URL for:", samplePath);
      const { data: signed, error: sErr } = await supabase.storage
        .from("invoices")
        .createSignedUrl(samplePath, 60);
      if (sErr) console.error("Signed URL error:", sErr);
      else console.log("Signed URL (expires 60s):", signed.signedUrl);
    } else {
      console.log("No sample pdf_path found to test signed URL.");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  } finally {
    process.exit(0);
  }
}

run();
