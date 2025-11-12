// src/lib/templates.js
// Templates metadata + HTML fragments for DollarChain invoice templates.
// Each template includes an `html` property (template literal) with placeholders like {{sellerName}}, {{itemsRows}}, {{total}}.
// Keep placeholders consistent with InvoicePreview builder: {{sellerName}}, {{sellerLogoUrl}}, {{sellerPhone}}, {{sellerEmail}},
// {{sellerAddress}}, {{sellerTagline}}, {{invoiceNumber}}, {{date}}, {{buyerName}}, {{buyerPhone}}, {{itemsRows}},
// {{subtotal}}, {{total}}, {{paymentNumber}}, {{paymentLabel}}, {{paymentNote}}, {{notesLine}}, {{qrDataUrl}}, {{payLink}}, {{dueDate}}, {{vatPercent}}, {{vatAmount}}.

export const TEMPLATES = [
  /* Local 1 — classic blue receipt (stronger ruled lines) */
  {
    id: "local-1",
    category: "local",
    name: "Local Compact",
    thumbnail: "/templates/local-1.png",
    description: "Narrow receipt style, mobile-first, M-Pesa / Paybill friendly.",
    options: { width: 360, qr: true, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#123A8A", headerBg: "#ffffff", textColor: "#0b1220", suggestedWidth: 360 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      sellerEmail: "hi@dollarchain.app",
      buyerName: "Grace Mwende",
      buyerPhone: "+254 712 345 678",
      items: "2x Cotton Shirt, 1x Leather Belt, 3x Socks",
      subtotal: "KES 5,400",
      total: "KES 5,400",
      paymentNumber: "Paybill 123456",
      paymentLabel: "M-Pesa Paybill",
      paymentNote: "Use invoice #123456 as reference",
      notesLine: "Thank you — please keep this receipt",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-18",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invoice — Local Compact</title>
  <style>
    :root{
      --paper-w:360px;
      --pad:10px;
      --blue:#123A8A;
      --muted:#6b7280;
      --text:#0b1220;
      --base-serif: "Merriweather", Georgia, "Times New Roman", serif;
      --base-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    *{box-sizing:border-box}
    body{font-family:var(--base-sans); background:#f7f8fb; padding:18px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
    .paper{width:var(--paper-w); background:#fff; padding:var(--pad); border-radius:6px; box-shadow:0 8px 22px rgba(8,12,16,0.05); border:1px solid #e6eef9; line-height:1.18;}
    .topPill{display:block; width:86px; margin:6px auto 4px; text-align:center; background:var(--blue); color:white; font-weight:900; padding:4px 6px; border-radius:6px; letter-spacing:1px; font-size:11px; font-family:var(--base-serif)}
    .company{font-weight:900; color:var(--blue); text-align:center; font-size:14px; margin-bottom:4px; font-family:var(--base-serif)}
    .meta{font-size:11px; color:var(--muted); text-align:center; white-space:pre-line; margin-bottom:8px;}
    .formRow{display:flex; gap:8px; font-size:12px; margin:6px 0; align-items:center;}
    .formRow .label{min-width:48px; color:var(--muted); font-size:11px;}
    .formLine{flex:1; border-bottom:2px solid #eef4ff; padding:6px 4px; font-weight:700; font-size:13px;}
    .divider{height:1px; background:#eef2f6; margin:10px 0;}
    /* ===== stronger, visible item lines ===== */
    table.items{width:100%; border-collapse:collapse; font-size:13px; margin-top:6px; background:linear-gradient(180deg,transparent 0, transparent calc(100% - 1px), rgba(19,58,138,0.06) 100%);}
    table.items thead td{font-weight:800; color:var(--blue); padding:8px 4px; border-bottom:3px solid rgba(18,58,138,0.18); font-size:12px;}
    table.items tbody tr{background:transparent;}
    table.items td{padding:10px 4px; border-bottom:2px solid rgba(18,58,138,0.08); vertical-align:middle;}
    table.items tbody tr:last-child td{border-bottom:2px dashed rgba(18,58,138,0.12);}
    .qty{width:52px; color:var(--muted); font-size:12px;}
    .price{width:86px; text-align:right; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace; font-size:12px;}
    .bottomRow{display:flex; justify-content:space-between; align-items:center; margin-top:8px;}
    .noBox{font-size:12px; color:#b91c1c; font-weight:800;}
    .totalBox{background:var(--blue); color:white; padding:6px 8px; border-radius:6px; font-weight:900; min-width:84px; text-align:center; font-size:13px;}
    .paybox{background:#fbfff9; border:1px solid #eef8ee; padding:10px; border-radius:8px; margin-top:10px; font-size:13px; display:flex; justify-content:space-between; align-items:center;}
    .qr{width:72px; height:72px; background:#fff; border-radius:6px; display:inline-block; object-fit:contain;}
    .foot{font-size:11px; color:var(--muted); margin-top:10px; text-align:center; white-space:pre-line;}
    @media print{body{background:transparent} .paper{box-shadow:none; border:none}}
  </style>
  </head>
  <body>
    <div class="paper" role="article" aria-label="Invoice receipt">
      <span class="topPill">INVOICE</span>
      <div class="company">{{sellerName}}</div>
      <div class="meta">{{sellerAddress}} · {{sellerPhone}}</div>

      <div class="formRow" aria-hidden="true">
        <div style="flex:1">
          <div class="label">To:</div>
          <div class="formLine">{{buyerName}}</div>
        </div>
        <div style="width:110px;">
          <div class="label">Date:</div>
          <div class="formLine">{{date}}</div>
        </div>
      </div>

      <div class="formRow" aria-hidden="true" style="margin-bottom:6px;">
        <div style="flex:1">
          <div class="label">Order No:</div>
          <div class="formLine">__________</div>
        </div>
        <div style="width:110px;">
          <div class="label">Delivery No:</div>
          <div class="formLine">__________</div>
        </div>
      </div>

      <div class="divider"></div>

      <table class="items" aria-label="Invoice items">
        <thead>
          <tr>
            <td class="qty">QTY</td>
            <td>Description</td>
            <td class="price">@</td>
            <td class="price">KSHS</td>
            <td class="price">CTS</td>
          </tr>
        </thead>
        <tbody>
          {{itemsRows}}
        </tbody>
      </table>

      <div class="bottomRow">
        <div class="noBox">No. 43672</div>
        <div class="totalBox">TOTAL<br/>{{total}}</div>
      </div>

      <div class="paybox" role="region" aria-label="Payment details">
        <div>
          <div style="font-size:12px;color:var(--muted)">Pay via</div>
          <div style="font-weight:800;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace;">{{paymentLabel}} · {{paymentNumber}}</div>
          <div style="font-size:12px;color:var(--muted); margin-top:6px;">{{paymentNote}}</div>
        </div>
        <div>
          {{#if qrDataUrl}}
            <img src="{{qrDataUrl}}" alt="Scan to pay" class="qr"/>
          {{/if}}
        </div>
      </div>

      <div class="foot">
        {{notesLine}} · Issued: {{date}}<div style="margin-top:6px;">Sent via DollarChain</div>
      </div>
    </div>
  </body>
  </html>`
  },

  /* Local 2 — modern green invoice (bolder separators) */
  {
    id: "local-2",
    category: "local",
    name: "Local Classic",
    thumbnail: "/templates/local-2.png",
    description: "Balanced print-friendly layout, clear payment area and QR.",
    options: { width: 480, qr: true, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#15803D", headerBg: "#ffffff", textColor: "#0b1220", suggestedWidth: 480 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      sellerEmail: "hi@dollarchain.app",
      buyerName: "James Otieno",
      buyerPhone: "+254 733 555 121",
      items: "1x Handmade Bag, 2x Silk Scarf",
      subtotal: "KES 3,200",
      total: "KES 3,200",
      paymentNumber: "Paybill 987654",
      paymentLabel: "M-Pesa Paybill",
      paymentNote: "Include invoice #987654 as reference",
      notesLine: "Packed and ready — deliver within 48 hours",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-25",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice — Local Classic</title>
  <style>
    :root{
      --w:480px;
      --pad:18px;
      --green:#15803D;
      --muted:#6b7280;
      --text:#0b1220;
      --base-sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --base-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;
    }
    *{box-sizing:border-box}
    body{font-family:var(--base-sans); background:#f6f7f8; display:flex; justify-content:center; padding:18px; -webkit-font-smoothing:antialiased;}
    .card{width:var(--w); background:white; border-radius:10px; padding:var(--pad); box-shadow:0 10px 30px rgba(8,12,16,0.04); border:1px solid #eef7ef; line-height:1.24;}
    .header{display:flex; justify-content:space-between; align-items:center; gap:12px;}
    .logo{height:56px; width:56px; object-fit:contain; border-radius:8px; background:#f7faf7; padding:6px;}
    .company{font-weight:800; font-size:16px; color:var(--green); letter-spacing:0.2px;}
    .meta{font-size:12px; color:var(--muted); white-space:pre-line; margin-top:4px;}
    .grid{display:grid; grid-template-columns:1fr auto; gap:12px; margin-top:14px;}
    .bill{font-size:13px}
    /* ===== make the item separators stronger ===== */
    .items{width:100%; border-collapse:collapse; margin-top:12px; font-size:13px; box-shadow:inset 0 -1px 0 rgba(21,128,61,0.03);}
    .items thead th{font-size:12px; text-align:left; color:var(--muted); padding:10px 6px; border-bottom:3px solid rgba(21,128,61,0.14);}
    .items td{padding:12px 6px; border-bottom:2px solid rgba(21,128,61,0.06); vertical-align:middle;}
    .items tbody tr:hover td{background:rgba(21,128,61,0.02);}
    .items tbody tr:last-child td{border-bottom:2px dashed rgba(21,128,61,0.08);}
    .right{text-align:right}
    .totals{margin-top:12px; display:flex; justify-content:flex-end; gap:18px; align-items:end;}
    .totalVal{font-weight:900; font-size:18px; color:var(--text);}
    .paymentCard{margin-top:12px; border-radius:8px; padding:12px; background:linear-gradient(180deg,#f6fff6,#f1fbef); border:1px solid #e6f6ea;}
    .payLink{display:inline-block; padding:8px 12px; background:var(--green); color:white; border-radius:8px; text-decoration:none; font-weight:700;}
    .qr{width:86px;height:86px;border-radius:6px;object-fit:contain}
    .mutedSmall{font-size:12px;color:var(--muted)}
    @media print{ .card{box-shadow:none; border:none} }
  </style>
  </head>
  <body>
    <div class="card" role="article" aria-label="Invoice">
      <header class="header">
        <div style="display:flex; gap:12px; align-items:center;">
          <div>
            <div class="company">{{sellerName}}</div>
            <div class="meta">{{sellerAddress}}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
          <div style="font-weight:900; font-size:18px; margin-top:6px;">Invoice</div>
          <div style="font-size:12px; color:var(--muted);">#{{invoiceNumber}} • {{date}}</div>
        </div>
      </header>

      <div class="grid" aria-hidden="false">
        <div>
          <div style="font-weight:700; margin-bottom:6px;">Bill to</div>
          <div class="bill">{{buyerName}} • {{buyerPhone}}</div>
        </div>
        <div style="text-align:right;">
          <div class="mutedSmall">Due</div>
          <div style="font-weight:700;">{{dueDate}}</div>
        </div>
      </div>

      <table class="items" aria-label="Line items">
        <thead>
          <tr><th>Description</th><th class="right">Rate, KSH</th><th class="right">Qty</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>
          {{itemsRows}}
        </tbody>
      </table>

      <div style="margin-top:10px;">
        <div style="display:flex; justify-content:space-between; color:var(--muted); font-size:13px;">
          <div>Subtotal</div><div>{{subtotal}}</div>
        </div>
        <div style="display:flex; justify-content:space-between; color:var(--muted); font-size:13px;">
          <div>VAT ({{vatPercent}}%)</div><div>{{vatAmount}}</div>
        </div>
        <div class="totals">
          <div style="text-align:right;">
            <div style="font-size:13px; color:var(--muted)">Total</div>
            <div class="totalVal">{{total}}</div>
          </div>
        </div>
      </div>

      <div class="paymentCard" role="region" aria-label="Payment details">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
          <div>
            <div class="mutedSmall">Payment method</div>
            <div style="font-weight:800;">{{paymentLabel}} • {{paymentNumber}}</div>
            <div style="font-size:12px;color:var(--muted); margin-top:6px;">{{paymentNote}}</div>
          </div>
          <div style="text-align:right;">
            <a class="payLink" href="{{payLink}}">Pay now</a>
            <div style="margin-top:8px;">
              {{#if qrDataUrl}}<img src="{{qrDataUrl}}" alt="QR to pay" class="qr"/>{{/if}}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px; font-size:12px; color:var(--muted)">{{notesLine}}</div>
    </div>
  </body>
  </html>`
  },

  /* Local 3 — corporate grey invoice (crisper grey separators) */
  {
    id: "local-3",
    category: "local",
    name: "Local Narrow",
    thumbnail: "/templates/local-3.png",
    description: "Very compact receipt for quick sales and WhatsApp sharing.",
    options: { width: 320, qr: false, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#111827", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 320 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Aisha Hassan",
      buyerPhone: "+254 722 333 444",
      items: "1x Coffee Mug, 2x Sticker Pack",
      subtotal: "KES 500",
      total: "KES 500",
      paymentNumber: "Phone: +254 722 333 444",
      paymentLabel: "Phone",
      paymentNote: "",
      notesLine: "Thanks for your purchase",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-11",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Receipt — Local Narrow</title>
  <style>
    :root{
      --w:320px;
      --pad:12px;
      --muted:#6b7280;
      --text:#07131a;
      --accent:#111827;
      --base-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    *{box-sizing:border-box}
    body{font-family:var(--base-sans); background:#fafafa; padding:18px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
    .paper{width:var(--w); background:#fff; padding:var(--pad); border-radius:8px; box-shadow:0 8px 20px rgba(0,0,0,0.04); border:1px solid #eef0f3; line-height:1.18;}
    .hdr{display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;}
    .logo{height:44px; width:44px; object-fit:contain; border-radius:6px; background:#f3f4f6; padding:6px;}
    .brand{font-weight:900; font-size:15px; color:var(--accent); letter-spacing:0.2px;}
    .invoiceLabel{font-weight:900; font-size:16px; color:#111827; letter-spacing:0.6px;}
    .meta{font-size:12px; color:var(--muted); white-space:pre-line;}
    hr.sep{border:none; border-top:1px solid #f1f3f5; margin:10px 0;}
    .to{font-size:13px; margin-bottom:6px;}
    /* ===== crisp grey lines for the receipt book look ===== */
    .items{width:100%; font-size:13px; border-top:2px solid #e6e9ee; border-bottom:2px solid #e6e9ee; margin:10px 0; border-collapse:collapse;}
    .items td{padding:10px 0; border-bottom:1.5px solid #e9edf2;}
    .items tbody tr:last-child td{border-bottom:1.5px dashed #dfe4ea;}
    .total{font-weight:800; font-size:15px; text-align:right; margin-top:8px;}
    .pay{margin-top:8px; padding:8px; background:#fafafa; border:1px solid #eef0f2; border-radius:6px; font-size:12px;}
    .foot{font-size:11px; color:var(--muted); margin-top:10px; text-align:center; white-space:pre-line;}
    @media print{ .paper{box-shadow:none; border:none} }
  </style>
  </head>
  <body>
    <div class="paper" role="article" aria-label="Receipt">
      <div class="hdr">
        <div style="display:flex; gap:10px; align-items:center;">
          <img src="{{sellerLogoUrl}}" alt="{{sellerName}}" class="logo" onerror="this.style.display='none'"/>
          <div>
            <div class="brand">{{sellerName}}</div>
            <div class="meta">{{sellerPhone}}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="invoiceLabel">INVOICE</div>
          <div class="meta">#{{invoiceNumber}} • {{date}}</div>
        </div>
      </div>

      <hr class="sep"/>

      <div class="to">
        <div style="font-weight:700;">To</div>
        <div class="meta">{{buyerName}} · {{buyerPhone}}</div>
      </div>

      <table class="items" aria-hidden="false">
        <tbody>
          {{itemsRows}}
        </tbody>
      </table>

      <div class="total">TOTAL: {{total}}</div>

      <div class="pay">
        <div style="font-weight:700;">Pay: {{paymentLabel}}</div>
        <div style="font-size:12px;color:var(--muted)">{{paymentNumber}}</div>
        {{#if qrDataUrl}}<div style="margin-top:8px;text-align:center;"><img src="{{qrDataUrl}}" alt="QR" style="width:86px;height:86px;object-fit:contain; border-radius:6px;"/></div>{{/if}}
      </div>

      <div class="foot">Thank you for your business · Sent via DollarChain</div>
    </div>
  </body>
  </html>`
  },

  /* Row 2: Colour Accent */
  {
    id: "accent-1",
    category: "accent",
    name: "Accent Sidebar",
    thumbnail: "/templates/accent-1.png",
    description: "Left sidebar in brand colour; modern and bold.",
    options: { width: 720, qr: false },
    style: { accentColor: "#0ea5a3", headerBg: "#0ea5a3", textColor: "#07131a", suggestedWidth: 720 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Sell more. Send invoices faster.",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Pauline Njeri",
      buyerPhone: "+254 700 111 222",
      items: "1x Jacket, 2x T-Shirt, 1x Cap",
      subtotal: "KES 9,800",
      total: "KES 9,800",
      paymentNumber: "Paybill 555444",
      paymentLabel: "M-Pesa Paybill",
      paymentNote: "Pay to Paybill 555444",
      notesLine: "Order processed — please check sizes",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-18",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Accent Sidebar</title>
<style>
  :root{ --accent:#0ea5a3; --bg:#fff; --text:#07131a; --muted:#64748b; --pad:18px; --w:720px; --radius:12px; --base-font:Inter, system-ui, -apple-system, "Segoe UI", Roboto; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f5f7f8; display:flex; justify-content:center; padding:18px; -webkit-font-smoothing:antialiased;}
  .wrap{width:var(--w);}
  .card{display:grid; grid-template-columns:180px 1fr; gap:0; background:var(--bg); border-radius:var(--radius); overflow:hidden; box-shadow:0 12px 36px rgba(10,15,20,0.06);}
  .sidebar{background:var(--accent); color:white; padding:var(--pad); display:flex; flex-direction:column; gap:10px; align-items:flex-start;}
  .logo{height:56px; width:56px; background:rgba(255,255,255,0.06); border-radius:8px; object-fit:contain;}
  .sidebar .brand{font-weight:900; font-size:18px; letter-spacing:0.2px;}
  .sidebar .tag{font-size:13px; opacity:0.95;}
  .content{padding:var(--pad);}
  .head{display:flex; justify-content:space-between; align-items:center;}
  .items table{width:100%; border-collapse:collapse; margin-top:14px; font-size:14px;}
  .items td, .items th{padding:10px 0; border-bottom:1px solid #f1f5f9;}
  .summary{display:flex; justify-content:flex-end; margin-top:14px; gap:12px;}
  .total{font-weight:900; font-size:20px;}
  .paybtn{display:inline-block; padding:10px 14px; border-radius:8px; background:var(--accent); color:white; text-decoration:none; font-weight:700;}
  @media (max-width:820px){ .card{grid-template-columns:1fr} .sidebar{flex-direction:row; justify-content:space-between; align-items:center} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card" role="article" aria-label="Invoice">
      <aside class="sidebar" aria-hidden="false">
        <img src="{{sellerLogoUrl}}" alt="{{sellerName}}" class="logo" onerror="this.style.display='none'"/>
        <div style="margin-top:6px">
          <div class="brand">{{sellerName}}</div>
          <div class="tag">{{sellerTagline}}</div>
        </div>
        <div style="margin-top:auto; font-size:12px; opacity:.95;">Invoice #{{invoiceNumber}}<br/>{{date}}</div>
      </aside>

      <main class="content">
        <div class="head">
          <div>
            <div style="font-weight:900; font-size:18px;">Invoice</div>
            <div style="color:var(--muted); font-size:13px;">Bill to: <strong>{{buyerName}}</strong></div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;">Total</div>
            <div class="total">{{total}}</div>
          </div>
        </div>

        <div class="items">
          <table aria-label="Line items">
            <thead><tr><th style="text-align:left">Item</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
              {{itemsRows}}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div style="text-align:right;">
            <div style="font-size:13px; color:var(--muted)">Subtotal</div>
            <div style="font-weight:700">{{subtotal}}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px;">
          <div style="font-size:13px; color:var(--muted)">{{notesLine}}</div>
          <a class="paybtn" href="{{payLink}}">Pay now</a>
        </div>
      </main>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "accent-2",
    category: "accent",
    name: "Accent Topband",
    thumbnail: "/templates/accent-2.png",
    description: "Top band accent colour, large Totals area and CTAs.",
    options: { width: 720, qr: false },
    style: { accentColor: "#ef4444", headerBg: "#ef4444", textColor: "#07131a", suggestedWidth: 720 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Sell more. Send invoices faster.",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Samuel Kimani",
      buyerPhone: "+254 711 222 333",
      items: "3x Dress Shirt, 1x Belt",
      subtotal: "KES 6,500",
      total: "KES 6,500",
      paymentNumber: "Paybill 222333",
      paymentLabel: "Paybill",
      paymentNote: "Reference: invoice #222333",
      notesLine: "Delivered to Nairobi CBD",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-20",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Accent Topband</title>
<style>
  :root{ --accent:#ef4444; --w:720px; --pad:20px; --muted:#6b7280; --text:#07131a; --base-font:Inter, system-ui, -apple-system, "Segoe UI", Roboto; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f6f7f8; padding:20px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 12px 36px rgba(12,14,20,0.06);}
  .band{background:linear-gradient(90deg,var(--accent), #c2410c); padding:20px; color:white;}
  .band .title{font-weight:900; font-size:18px;}
  .body{padding:18px;}
  .meta{display:flex; justify-content:space-between; gap:12px; color:var(--muted); font-size:13px;}
  .items{margin-top:12px; width:100%; border-collapse:collapse;}
  .items td, .items th{padding:10px 0; border-bottom:1px solid #f1f5f9;}
  .cta{margin-top:14px; display:flex; justify-content:flex-end;}
  .btn{background:var(--accent); color:white; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:700;}
</style>
</head>
<body>
  <div class="card" role="article">
    <div class="band">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:14px;">
          <img src="{{sellerLogoUrl}}" alt="{{sellerName}}" style="height:46px; width:46px; object-fit:contain; border-radius:8px; background:rgba(255,255,255,0.06)" onerror="this.style.display='none'"/>
          <div>
            <div class="title">{{sellerName}}</div>
            <div style="font-size:12px; opacity:.95;">{{sellerTagline}}</div>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-weight:700;">Invoice #{{invoiceNumber}}</div>
          <div style="font-size:13px;">{{date}}</div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="meta">
        <div>Bill to: <strong>{{buyerName}}</strong></div>
        <div>Due: <strong>{{dueDate}}</strong></div>
      </div>

      <table class="items" aria-label="Items list">
        <tbody>
          {{itemsRows}}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:12px;">
        <div style="color:var(--muted);">Notes: {{notesLine}}</div>
        <div style="text-align:right;">
          <div style="color:var(--muted)">Subtotal</div>
          <div style="font-weight:800; font-size:18px;">{{total}}</div>
        </div>
      </div>

      <div class="cta">
        <a href="{{payLink}}" class="btn">Pay Now</a>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "accent-3",
    category: "accent",
    name: "Accent Blocks",
    thumbnail: "/templates/accent-3.png",
    description: "Color blocks to segment invoice data and draw attention.",
    options: { width: 780, qr: false },
    style: { accentColor: "#6366f1", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 780 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Sell more. Send invoices faster.",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Mercy Wanjiru",
      buyerPhone: "+254 734 999 000",
      items: "2x Candle Set, 1x Diffuser",
      subtotal: "KES 3,600",
      total: "KES 3,600",
      paymentNumber: "Paybill 444111",
      paymentLabel: "Paybill",
      paymentNote: "Include order reference",
      notesLine: "Gift-wrapped on request",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-15",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Accent Blocks</title>
<style>
  :root{ --accent:#6366f1; --muted:#6b7280; --text:#07131a; --w:780px; --pad:18px; --base-font:Inter, system-ui, -apple-system, "Segoe UI", Roboto; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f3f4f6; display:flex; justify-content:center; padding:20px; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:#fff; border-radius:10px; padding:var(--pad); box-shadow:0 14px 40px rgba(10,12,20,0.06);}
  .row{display:flex; gap:14px;}
  .block{flex:1; padding:14px; border-radius:10px; background:#fbfbff;}
  .accentBlock{background:linear-gradient(180deg,var(--accent), #4f46e5); color:white;}
  .items{margin-top:12px; border-collapse:collapse; width:100%;}
  .items td{padding:10px 0; border-bottom:1px solid #f2f4fb;}
  .summary{margin-top:12px; display:flex; justify-content:flex-end;}
  .total{font-weight:900; font-size:20px;}
</style>
</head>
<body>
  <div class="card" role="article">
    <div class="row">
      <div class="block accentBlock">
        <div style="font-weight:900; font-size:18px;">{{sellerName}}</div>
        <div style="font-size:13px; opacity:.95;">{{sellerTagline}}</div>
      </div>
      <div class="block">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <div style="font-weight:700;">Bill to</div>
            <div style="color:var(--muted)">{{buyerName}}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:var(--muted)">Invoice</div>
            <div style="font-weight:800;">#{{invoiceNumber}}</div>
          </div>
        </div>
      </div>
    </div>

    <table class="items" aria-label="Line items">
      <tbody>{{itemsRows}}</tbody>
    </table>

    <div class="summary">
      <div style="text-align:right;">
        <div style="color:var(--muted)">Subtotal</div>
        <div class="total">{{total}}</div>
      </div>
    </div>

    <div style="margin-top:12px; color:var(--muted)">{{notesLine}}</div>
  </div>
</body>
</html>`
  },

  /* Row 3: Clean Minimalist */
  {
    id: "clean-1",
    category: "minimal",
    name: "Minimalist Classic",
    thumbnail: "/templates/clean-1.png",
    description: "Whitespace, subtle typography, professional and clean.",
    options: { width: 820, qr: false },
    style: { accentColor: "#16a34a", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 820 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Lilian Kariuki",
      buyerPhone: "+254 701 444 555",
      items: "1x Designer Scarf, 2x Earrings",
      subtotal: "KES 4,200",
      total: "KES 4,200",
      paymentNumber: "Paybill 101010",
      paymentLabel: "Paybill",
      paymentNote: "Use invoice as reference",
      notesLine: "Handmade items — no returns after 7 days",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-30",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Minimalist Classic</title>
<style>
  :root{ --bg:#ffffff; --text:#07131a; --muted:#6b7280; --pad:24px; --w:820px; --radius:12px; --base-font:Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f7f8fa; display:flex; justify-content:center; padding:22px; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:var(--bg); border-radius:var(--radius); padding:var(--pad); box-shadow:0 12px 36px rgba(10,15,20,0.06);}
  .header{display:flex; justify-content:space-between; align-items:flex-start;}
  .title{font-weight:900; font-size:22px;}
  .company{font-weight:700; font-size:16px;}
  .meta{color:var(--muted); font-size:13px; white-space:pre-line;}
  .items{width:100%; border-collapse:collapse; margin-top:18px;}
  .items th{font-size:12px; color:var(--muted); text-align:left; padding-bottom:8px;}
  .items td{padding:12px 0; border-bottom:1px solid #f1f4f8;}
  .totals{margin-top:16px; display:flex; justify-content:flex-end; gap:18px; align-items:end;}
  .totalVal{font-weight:900; font-size:20px;}
  .footer{margin-top:18px; font-size:13px; color:var(--muted);}
</style>
</head>
<body>
  <div class="card" role="article">
    <div class="header">
      <div>
        <div class="title">Invoice</div>
        <div class="company">{{sellerName}}</div>
        <div class="meta">{{sellerAddress}} · {{sellerPhone}}</div>
      </div>
      <div style="text-align:right;">
        <div class="meta">Invoice #{{invoiceNumber}}</div>
        <div class="meta">{{date}}</div>
      </div>
    </div>

    <div style="margin-top:18px;">
      <div style="font-weight:700;">Bill to</div>
      <div class="meta">{{buyerName}} · {{buyerPhone}}</div>
    </div>

    <table class="items" aria-label="Invoice items">
      <thead><tr><th style="width:70%">Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        {{itemsRows}}
      </tbody>
    </table>

    <div class="totals">
      <div style="text-align:right;">
        <div class="meta">Subtotal</div>
        <div style="font-weight:700;">{{subtotal}}</div>
      </div>
      <div style="text-align:right;">
        <div class="meta">Total</div>
        <div class="totalVal">{{total}}</div>
      </div>
    </div>

    <div class="footer">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>Notes: {{notesLine}}</div>
        <div>Sent via DollarChain</div>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "clean-2",
    category: "minimal",
    name: "Minimalist Wide",
    thumbnail: "/templates/clean-2.png",
    description: "Wide layout, precise typographic scale — great for printing.",
    options: { width: 1000, qr: false },
    style: { accentColor: "#111827", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 1000 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Daniel Mutua",
      buyerPhone: "+254 709 888 777",
      items: "1x Office Chair, 2x Cushion",
      subtotal: "KES 18,400",
      total: "KES 18,400",
      paymentNumber: "Bank Acc: 123-456-789",
      paymentLabel: "Bank Transfer",
      paymentNote: "Use invoice reference on payment",
      notesLine: "Large order — allow 3 business days",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-12-11",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Minimalist Wide</title>
<style>
  :root{ --w:1000px; --pad:28px; --muted:#6b7280; --text:#07131a; --base-font:Inter, system-ui, -apple-system, "Segoe UI", Roboto; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f4f6f8; padding:26px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:#fff; border-radius:10px; padding:var(--pad); box-shadow:0 12px 36px rgba(6,8,12,0.06);}
  .top{display:flex; justify-content:space-between; align-items:center;}
  .logo{height:64px; width:64px; object-fit:contain;}
  .items{margin-top:22px; width:100%; border-collapse:collapse;}
  .items th{color:var(--muted); text-align:left; padding:12px 0;}
  .items td{padding:12px 0; border-bottom:1px solid #eef2f6;}
  .summary{display:flex; justify-content:flex-end; margin-top:18px;}
  .total{font-weight:900; font-size:20px; margin-left:12px;}
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div style="display:flex; gap:16px; align-items:center;">
        <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
        <div>
          <div style="font-weight:800; font-size:18px;">{{sellerName}}</div>
          <div style="color:var(--muted)">{{sellerAddress}}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:800; font-size:20px;">Invoice</div>
        <div style="color:var(--muted)">{{date}} • #{{invoiceNumber}}</div>
      </div>
    </div>

    <div style="margin-top:16px; display:flex; justify-content:space-between;">
      <div>
        <div style="font-weight:700;">Bill to</div>
        <div style="color:var(--muted)">{{buyerName}}</div>
      </div>
      <div style="text-align:right; color:var(--muted)">{{paymentLabel}}: {{paymentNumber}}</div>
    </div>

    <table class="items" aria-label="Line items">
      <thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>{{itemsRows}}</tbody>
    </table>

    <div class="summary">
      <div style="text-align:right;">
        <div style="color:var(--muted)">Subtotal</div>
        <div class="total">{{total}}</div>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "clean-3",
    category: "minimal",
    name: "Minimalist Compact",
    thumbnail: "/templates/clean-3.png",
    description: "Tighter spacing, still minimal — for short receipts/invoices.",
    options: { width: 680, qr: false },
    style: { accentColor: "#16a34a", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 680 },
    sampleData: {
      sellerName: "DollarChain",
      sellerLogoUrl: "/logos/dollarchain-logo.png",
      sellerTagline: "Fast invoices via WhatsApp",
      sellerAddress: "123 Nairobi Rd\nNairobi, Kenya",
      sellerPhone: "+254 700 000 000",
      buyerName: "Ruth Achieng",
      buyerPhone: "+254 726 111 222",
      items: "1x Keychain, 1x Greeting Card",
      subtotal: "KES 350",
      total: "KES 350",
      paymentNumber: "Phone: +254 726 111 222",
      paymentLabel: "Phone",
      paymentNote: "",
      notesLine: "Small purchase — thank you",
      qrDataUrl: "",
      date: "2025-11-11",
      dueDate: "2025-11-11",
      vatPercent: "0",
      vatAmount: "KES 0",
      payLink: "#",
      currency: "KES"
    },
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — Minimalist Compact</title>
<style>
  :root{ --w:680px; --pad:16px; --muted:#6b7280; --base-font:Inter, system-ui, -apple-system, Roboto, Arial; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#fafafb; padding:18px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:white; border-radius:8px; padding:var(--pad); box-shadow:0 10px 28px rgba(8,12,16,0.05);}
  .top{display:flex; justify-content:space-between; align-items:center;}
  .items{margin-top:12px; border-collapse:collapse; width:100%;}
  .items td{padding:8px 0; border-bottom:1px solid #f2f5f9;}
  .total{font-weight:800; font-size:18px; text-align:right; margin-top:8px;}
  .footer{margin-top:12px; color:var(--muted); font-size:13px;}
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div>
        <div style="font-weight:800;">{{sellerName}}</div>
        <div style="color:var(--muted); font-size:13px">{{sellerPhone}}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">Invoice</div>
        <div style="color:var(--muted)">{{date}} • #{{invoiceNumber}}</div>
      </div>
    </div>

    <div style="margin-top:12px;">
      <div style="font-weight:700;">Bill to</div>
      <div style="color:var(--muted)">{{buyerName}}</div>
    </div>

    <table class="items" aria-label="Items">
      <tbody>{{itemsRows}}</tbody>
    </table>

    <div class="total">Total: {{total}}</div>

    <div class="footer">Notes: {{notesLine}} · Sent via DollarChain</div>
  </div>
</body>
</html>`
  },
];

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
