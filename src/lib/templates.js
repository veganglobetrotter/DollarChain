// src/lib/templates.js
// Templates metadata + HTML fragments for DollarChain invoice templates.
// Each template includes an `html` property (template literal) with placeholders like {{sellerName}}, {{itemsRows}}, {{total}}.
// Keep placeholders consistent with InvoicePreview builder: {{sellerName}}, {{sellerLogoUrl}}, {{sellerPhone}}, {{sellerEmail}},
// {{sellerAddress}}, {{sellerTagline}}, {{invoiceNumber}}, {{date}}, {{buyerName}}, {{buyerPhone}}, {{itemsRows}},
// {{subtotal}}, {{total}}, {{paymentNumber}}, {{paymentLabel}}, {{paymentNote}}, {{notesLine}}, {{qrDataUrl}}, {{payLink}}, {{dueDate}}, {{vatPercent}}, {{vatAmount}}.

export const TEMPLATES = [
  /* Row 1: Localised / Print-Friendly */
  {
    id: "local-1",
    category: "local",
    name: "Local Compact",
    thumbnail: "/templates/local-1.png",
    description: "Narrow receipt style, mobile-first, M-Pesa / Paybill friendly.",
    options: { width: 360, qr: true, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#1a8917", headerBg: "#ffffff", textColor: "#0b1220", suggestedWidth: 360 },
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
      qrDataUrl: "", // optional
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
    --page-bg: #ffffff;
    --text: #0b1220;
    --muted: #6b7280;
    --accent: #1a8917;
    --paper-width: 360px;
    --pad: 14px;
    --radius: 10px;
    --base-font: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  }
  * { box-sizing: border-box; }
  body{font-family:var(--base-font); color:var(--text); background: #f6f7f8; padding: 18px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
  .paper{width:var(--paper-width); background:var(--page-bg); padding:var(--pad); border-radius:var(--radius); box-shadow: 0 8px 30px rgba(10,10,10,0.04);}
  .hdr{display:flex; gap:10px; align-items:center; margin-bottom:8px;}
  .logo{width:56px; height:56px; border-radius:8px; background:#f3f4f6; object-fit:contain;}
  .seller{font-weight:800; font-size:14px; letter-spacing:0.2px;}
  .meta{font-size:12px; color:var(--muted); white-space:pre-line;}
  .divider{height:1px; background:#eef2f6; margin:10px 0;}
  .items{width:100%; border-collapse:collapse; font-size:13px;}
  .items th{font-weight:700; font-size:12px; text-align:left; padding:8px 0; color:var(--muted);}
  .items td{padding:8px 0; border-bottom:1px dashed #eef2f6; vertical-align:middle;}
  .item-name{font-weight:500;}
  .item-qty{color:var(--muted); font-size:12px; padding-left:6px;}
  .right{text-align:right;}
  .subtotalRow{display:flex; justify-content:space-between; margin-top:10px; color:var(--muted); font-size:13px;}
  .total{font-weight:900; font-size:16px; margin-top:6px; text-align:right;}
  .paybox{background:#f9faf9; border:1px solid #eef6ee; padding:10px; border-radius:8px; margin-top:12px; font-size:13px; display:flex; justify-content:space-between; align-items:center;}
  .paybox .label{font-size:12px; color:var(--muted);}
  .paybox .number{font-weight:800; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;}
  .qr{width:78px; height:78px; background:#fff; border-radius:6px; display:inline-block; object-fit:contain;}
  .foot{font-size:11px; color:var(--muted); margin-top:12px; text-align:center; white-space:pre-line;}
  @media print{ body{background:transparent} .paper{box-shadow:none; border: none;} }
</style>
</head>
<body>
  <div class="paper" role="article" aria-label="Invoice receipt">
    <div class="hdr">
      <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
      <div style="flex:1;">
        <div class="seller">{{sellerName}}</div>
        <div class="meta">{{sellerAddress}} · {{sellerPhone}}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">Receipt</div>
        <div class="meta">#{{invoiceNumber}}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div style="font-size:13px; margin-bottom:6px;">
      <div style="font-weight:700;">Bill to</div>
      <div class="meta">{{buyerName}} · {{buyerPhone}}</div>
    </div>

    <table class="items" aria-label="Invoice items">
      <thead>
        <tr><th>Item</th><th class="right">Total</th></tr>
      </thead>
      <tbody>
        {{itemsRows}}
      </tbody>
    </table>

    <div class="subtotalRow">
      <div>Subtotal</div>
      <div>{{subtotal}}</div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="font-size:13px; color:var(--muted)">Total</div>
      <div class="total">{{total}}</div>
    </div>

    <div class="paybox" role="region" aria-label="Payment details">
      <div>
        <div class="label">Pay via</div>
        <div class="number">{{paymentLabel}} · {{paymentNumber}}</div>
        <div style="font-size:12px; color:var(--muted)">{{paymentNote}}</div>
      </div>
      <div>
        {{#if qrDataUrl}}
          <img src="{{qrDataUrl}}" alt="Scan to pay" class="qr"/>
        {{/if}}
      </div>
    </div>

    <div class="foot">
      {{notesLine}} · Issued: {{date}}
      <div style="margin-top:6px;">Sent via DollarChain</div>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "local-2",
    category: "local",
    name: "Local Classic",
    thumbnail: "/templates/local-2.png",
    description: "Balanced print-friendly layout, clear payment area and QR.",
    options: { width: 480, qr: true, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#1a8917", headerBg: "#ffffff", textColor: "#0b1220", suggestedWidth: 480 },
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
      qrDataUrl: "", // optional data URL
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
  :root{ --bg:#ffffff; --text:#0b1220; --muted:#6b7280; --accent:#1a8917; --w:480px; --pad:18px; --radius:12px; --base-font: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#f3f4f6; display:flex; justify-content:center; padding:18px; -webkit-font-smoothing:antialiased;}
  .card{width:var(--w); background:var(--bg); padding:var(--pad); border-radius:var(--radius); box-shadow:0 10px 30px rgba(6,10,15,0.06);}
  header{display:flex; justify-content:space-between; align-items:center; gap:12px;}
  .logo{height:56px; width:56px; object-fit:contain; border-radius:8px; background:#fafafa;}
  .company{font-weight:800; font-size:16px;}
  .meta{font-size:12px; color:var(--muted); white-space:pre-line;}
  .grid{display:grid; grid-template-columns:1fr auto; gap:8px; margin-top:14px;}
  .items{width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;}
  .items th{font-size:12px; text-align:left; color:var(--muted); padding:8px 0;}
  .items td{padding:10px 0; border-bottom:1px solid #f1f5f9;}
  .totalRow{display:flex; justify-content:space-between; margin-top:10px; font-weight:800; font-size:15px;}
  .paymentCard{margin-top:12px; border-radius:8px; padding:12px; background:linear-gradient(180deg,#f8fff8,#f0fbf0); border:1px solid #e6f4e8;}
  .footer{margin-top:14px; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; align-items:center;}
  @media print{ .card{box-shadow:none} }
</style>
</head>
<body>
  <div class="card" role="article" aria-label="Invoice">
    <header>
      <div style="display:flex; align-items:center; gap:14px;">
        <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
        <div>
          <div class="company">{{sellerName}}</div>
          <div class="meta">{{sellerAddress}}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:900; font-size:16px;">Invoice</div>
        <div class="meta">#{{invoiceNumber}} • {{date}}</div>
      </div>
    </header>

    <div class="grid" aria-hidden="false">
      <div>
        <div style="font-weight:700; margin-bottom:6px;">Bill to</div>
        <div class="meta">{{buyerName}} • {{buyerPhone}}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px; color:var(--muted)">Due</div>
        <div style="font-weight:700;">{{dueDate}}</div>
      </div>
    </div>

    <table class="items" aria-label="Line items">
      <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
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
      <div class="totalRow"><div>Total</div><div>{{total}}</div></div>
    </div>

    <div class="paymentCard" role="region" aria-label="Payment details">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
        <div>
          <div style="font-size:12px;color:var(--muted)">Payment method</div>
          <div style="font-weight:800;">{{paymentLabel}} • {{paymentNumber}}</div>
          <div style="font-size:12px;color:var(--muted); margin-top:6px;">Please use invoice #{{invoiceNumber}} as reference.</div>
        </div>
        <div>
          {{#if qrDataUrl}}<img src="{{qrDataUrl}}" alt="QR to pay" style="width:86px;height:86px;border-radius:6px;object-fit:contain"/>{{/if}}
        </div>
      </div>
    </div>

    <div class="footer">
      <div>Notes: <span style="color:var(--muted)">{{notesLine}}</span></div>
      <div style="text-align:right;">Sent via DollarChain</div>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "local-3",
    category: "local",
    name: "Local Narrow",
    thumbnail: "/templates/local-3.png",
    description: "Very compact receipt for quick sales and WhatsApp sharing.",
    options: { width: 320, qr: false, showPaymentLabel: true, currency: "KES" },
    style: { accentColor: "#1a8917", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 320 },
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
  :root{ --w:320px; --pad:12px; --text:#07131a; --muted:#6b7280; --accent:#1a8917; --base-font: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace; }
  *{box-sizing:border-box}
  body{font-family:var(--base-font); background:#fafafa; padding:18px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
  .paper{width:var(--w); background:#fff; padding:var(--pad); border-radius:8px; box-shadow:0 8px 20px rgba(0,0,0,0.04);}
  .center{text-align:center;}
  .logo{height:48px; object-fit:contain; margin:0 auto; display:block;}
  .items{width:100%; font-size:13px; border-top:1px dashed #eee; border-bottom:1px dashed #eee; margin:10px 0;}
  .items tr td{padding:6px 0;}
  .total{font-weight:800; font-size:15px; margin-top:8px; text-align:right;}
  .pay{margin-top:8px; padding:8px; background:#fbfff9; border:1px solid #eef8ee; border-radius:8px; font-size:12px;}
  .foot{font-size:11px; color:var(--muted); margin-top:10px; text-align:center; white-space:pre-line;}
</style>
</head>
<body>
  <div class="paper" role="article" aria-label="Receipt">
    <img src="{{sellerLogoUrl}}" alt="{{sellerName}}" class="logo" onerror="this.style.display='none'"/>
    <div class="center" style="font-weight:800;">{{sellerName}}</div>
    <div class="center" style="font-size:12px;color:var(--muted);">{{sellerPhone}}</div>

    <hr style="border:none;border-top:1px dashed #eee;margin:10px 0"/>

    <div style="font-size:13px;"><strong>To:</strong> {{buyerName}}</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">#{{invoiceNumber}} • {{date}}</div>

    <table class="items" aria-hidden="false">
      <tbody>
        {{itemsRows}}
      </tbody>
    </table>

    <div class="total">TOTAL: {{total}}</div>

    <div class="pay">
      <div style="font-weight:700;">Pay: {{paymentLabel}}</div>
      <div style="font-size:12px;color:var(--muted)">{{paymentNumber}}</div>
      {{#if qrDataUrl}}<div style="margin-top:8px;text-align:center;"><img src="{{qrDataUrl}}" alt="QR" style="width:80px;height:80px;object-fit:contain"/></div>{{/if}}
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
