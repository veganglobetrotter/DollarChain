import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const path = process.argv[2];
if (!path) { console.error("Usage: node get-signed-url.mjs <path>"); process.exit(2); }

(async () => {
  const { data, error } = await supabase
    .storage
    .from('invoices')
    .createSignedUrl(path, 60); // 60 seconds
  if (error) { console.error('error', error); process.exit(1); }
  console.log('signedUrl:', data.signedURL);
})();
