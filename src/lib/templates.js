// src/lib/templates.js
// Canonical source-of-truth for invoice templates used in the app.
// Each template includes a small set of metadata and a lightweight HTML fragment placeholder.
// The `html` field is a parameterized placeholder you can later replace with server-side templates
// or React-to-static markup rendering when wiring PDF generation.

export const TEMPLATES = [
  /* Row 1: Localised / Print-Friendly (3) */
  {
    id: "local-1",
    category: "local",
    name: "Local Compact",
    thumbnail: "", // use public/templates/local-1.png if you add images
    description: "Narrow receipt style, mobile-first, M-Pesa / Paybill friendly.",
    options: { width: 360, qr: true, showPaymentLabel: true },
    html: "<div><!-- local-1 HTML template placeholder: {{seller}}, {{buyer}}, {{items}}, {{total}} --></div>",
  },
  {
    id: "local-2",
    category: "local",
    name: "Local Classic",
    thumbnail: "",
    description: "Balanced print-friendly layout, clear payment area and QR.",
    options: { width: 480, qr: true, showPaymentLabel: true },
    html: "<div><!-- local-2 HTML template placeholder --></div>",
  },
  {
    id: "local-3",
    category: "local",
    name: "Local Narrow",
    thumbnail: "",
    description: "Very compact receipt for quick sales and WhatsApp sharing.",
    options: { width: 320, qr: false, showPaymentLabel: true },
    html: "<div><!-- local-3 HTML template placeholder --></div>",
  },

  /* Row 2: Colour Accent (3) */
  {
    id: "accent-1",
    category: "accent",
    name: "Accent Sidebar",
    thumbnail: "",
    description: "Left sidebar in brand colour; modern and bold.",
    options: { width: 720, qr: false },
    html: "<div><!-- accent-1 HTML template placeholder --></div>",
  },
  {
    id: "accent-2",
    category: "accent",
    name: "Accent Topband",
    thumbnail: "",
    description: "Top band accent colour, large Totals area and CTAs.",
    options: { width: 720, qr: false },
    html: "<div><!-- accent-2 HTML template placeholder --></div>",
  },
  {
    id: "accent-3",
    category: "accent",
    name: "Accent Blocks",
    thumbnail: "",
    description: "Color blocks to segment invoice data and draw attention.",
    options: { width: 720, qr: false },
    html: "<div><!-- accent-3 HTML template placeholder --></div>",
  },

  /* Row 3: Clean Minimalist (3) */
  {
    id: "clean-1",
    category: "minimal",
    name: "Minimalist Classic",
    thumbnail: "",
    description: "Whitespace, subtle typography, professional and clean.",
    options: { width: 800, qr: false },
    html: "<div><!-- clean-1 HTML template placeholder --></div>",
  },
  {
    id: "clean-2",
    category: "minimal",
    name: "Minimalist Wide",
    thumbnail: "",
    description: "Wide layout, precise typographic scale — great for printing.",
    options: { width: 900, qr: false },
    html: "<div><!-- clean-2 HTML template placeholder --></div>",
  },
  {
    id: "clean-3",
    category: "minimal",
    name: "Minimalist Compact",
    thumbnail: "",
    description: "Tighter spacing, still minimal — for short receipts/invoices.",
    options: { width: 640, qr: false },
    html: "<div><!-- clean-3 HTML template placeholder --></div>",
  },
];

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
