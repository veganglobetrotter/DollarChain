// src/lib/templates.js
// Templates metadata + HTML fragments for DollarChain invoice templates.
// Each template includes an `html` property (template literal) with placeholders like {{sellerName}}, {{itemsRows}}, {{total}}.
// Keep placeholders consistent with InvoicePreview builder: {{sellerName}}, {{sellerLogoUrl}}, {{sellerPhone}}, {{sellerEmail}},
// {{sellerAddress}}, {{sellerTagline}}, {{invoiceNumber}}, {{date}}, {{buyerName}}, {{buyerPhone}}, {{itemsRows}},
// {{subtotal}}, {{total}}, {{paymentNumber}}, {{paymentLabel}}, {{paymentNote}}, {{notesLine}}, {{qrDataUrl}}, {{payLink}}, {{dueDate}}, {{vatPercent}}, {{vatAmount}}.

export const TEMPLATES = [
  /* Row 1: Localised / Print-Friendly */
  /* Local 1 — classic blue receipt (stronger ruled lines) */
  // src/lib/templates.js
  // Templates metadata + HTML fragments for DollarChain invoice templates.
  // Each template includes an `html` property (template literal) with placeholders like {{sellerName}}, {{itemsRows}}, {{total}}.
  // Keep placeholders consistent with InvoicePreview builder: {{sellerName}}, {{sellerLogoUrl}}, {{sellerPhone}}, {{sellerEmail}},
  // {{sellerAddress}}, {{sellerTagline}}, {{invoiceNumber}}, {{date}}, {{buyerName}}, {{buyerPhone}}, {{itemsRows}},
  // {{subtotal}}, {{total}}, {{paymentNumber}}, {{paymentLabel}}, {{paymentNote}}, {{notesLine}}, {{qrDataUrl}}, {{payLink}}, {{dueDate}}, {{vatPercent}}, {{vatAmount}}.

  export const TEMPLATES = [
    /* Row 1: Localised / Print-Friendly */
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
        // include unit prices in sample data to show column mapping in preview
        items: "2 x Cotton Shirt @ 1800, 1 x Leather Belt @ 1200, 3 x Socks @ 200",
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

    <!-- Normalizer script: when itemsRows is not pre-rendered as <tr>s, parse plain-text items string
         into structured rows (qty, description, unitPrice, total). This keeps templates backward-compatible
         with older forms that submit a single items string like "2 x Cotton Shirt @ 1800, 1 x Belt @ 1200". -->
    <script>
      (function(){
        function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        function parseLine(line){
          line = (line||'').trim();
          if(!line) return null;
          var qty='', desc='', unitPrice='', total='';
          // pattern: "2 x Item @ 1800"
          var m = line.match(/^(\d+)\s*[x×]\s*(.+?)(?:\s*@\s*([\d,\.]+))?$/i);
          if(m){ qty = m[1]; desc = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; if(unitPrice && qty){ total = ''; } return {qty, desc, unitPrice, total}; }
          // pattern: "Item - 2 - 1800"
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,\.]+))?/);
          if(m){ desc = m[1].trim(); qty = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; return {qty, desc, unitPrice, total}; }
          // pipe or comma separated: desc | qty | unit
          var parts = line.split(/\s*\|\s*/);
          if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          parts = line.split(/\s*,\s*/);
          if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          // leading qty
          m = line.match(/^(\d+)\s+(.+)$/);
          if(m){ qty = m[1]; desc = m[2].trim(); return {qty, desc, unitPrice, total}; }
          // fallback: treat everything as description
          desc = line; return {qty, desc, unitPrice, total};
        }

        function normalize(src){
          if(!src) return [];
          if(Array.isArray(src)) return src.map(it=>({qty:it.qty||'', desc:it.description||it.name||'', unitPrice:it.unitPrice||it.price||'', total:it.total||''}));
          var raw = String(src||'');
          var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){return l.trim();}).filter(Boolean);
          var out = [];
          for(var i=0;i<lines.length;i++){ var item = parseLine(lines[i]); if(item) out.push(item); }
          return out;
        }

        function renderRows(items){
          return items.map(function(it){
            return '<tr>' +
              '<td class="qty">'+escapeHtml(it.qty)+'</td>' +
              '<td>'+escapeHtml(it.desc)+'</td>' +
              '<td class="price">'+escapeHtml(it.unitPrice||'')+'</td>' +
              '<td class="price">'+escapeHtml(it.total||'')+'</td>' +
              '<td class="price"></td>' +
              '</tr>';
          }).join('');
        }

        try{
          var tbody = document.querySelector('table.items tbody');
          if(!tbody) return;
          // if tbody already has <tr> we assume server-side rendering populated it
          if(tbody.querySelector('tr')) return;
          // if placeholder replacement put a single plain-text items string here, normalize it
          var raw = tbody.textContent || '';
          // also support a data-items attribute on the table if present
          var table = document.querySelector('table.items');
          var dataItems = table && table.getAttribute('data-items');
          var itemsSource = (dataItems && dataItems.trim()) || raw;
          var items = normalize(itemsSource);
          if(items.length) tbody.innerHTML = renderRows(items);
        }catch(e){ console.error('items normalizer error', e); }
      })();
    </script>
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
        items: "1 x Handmade Bag @ 1200, 2 x Silk Scarf @ 1000",
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

    <script>
      (function(){
        function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        function parseLine(line){
          line = (line||'').trim(); if(!line) return null;
          var qty='', desc='', unitPrice='', total='';
          var m = line.match(/^(\d+)\s*[x×]\s*(.+?)(?:\s*@\s*([\d,\.]+))?$/i);
          if(m){ qty = m[1]; desc = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; return {qty, desc, unitPrice, total}; }
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,\.]+))?/);
          if(m){ desc = m[1].trim(); qty = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; return {qty, desc, unitPrice, total}; }
          var parts = line.split(/\s*\|\s*/); if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          parts = line.split(/\s*,\s*/); if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          m = line.match(/^(\d+)\s+(.+)$/); if(m){ qty = m[1]; desc = m[2].trim(); return {qty, desc, unitPrice, total}; }
          desc = line; return {qty, desc, unitPrice, total};
        }
        function normalize(src){ if(!src) return []; if(Array.isArray(src)) return src.map(it=>({qty:it.qty||'', desc:it.description||it.name||'', unitPrice:it.unitPrice||it.price||'', total:it.total||''}));
          var raw = String(src||''); var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){return l.trim();}).filter(Boolean); var out=[]; for(var i=0;i<lines.length;i++){ var item = parseLine(lines[i]); if(item) out.push(item); } return out; }
        function renderRows(items){ return items.map(function(it){ return '<tr><td>'+escapeHtml(it.desc)+'</td><td class="price">'+escapeHtml(it.unitPrice||'')+'</td><td class="right">'+escapeHtml(it.qty||'')+'</td><td class="right">'+escapeHtml(it.total||'')+'</td></tr>'; }).join(''); }
        try{ var tbody = document.querySelector('table.items tbody'); if(!tbody) return; if(tbody.querySelector('tr')) return; var raw = tbody.textContent || ''; var table = document.querySelector('table.items'); var dataItems = table && table.getAttribute('data-items'); var itemsSource = (dataItems && dataItems.trim()) || raw; var items = normalize(itemsSource); if(items.length) tbody.innerHTML = renderRows(items); }catch(e){ console.error('items normalizer error', e); }
      })();
    </script>
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
        items: "1 x Coffee Mug @ 200, 2 x Sticker Pack @ 150",
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

    <script>
      (function(){
        function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        function parseLine(line){
          line = (line||'').trim(); if(!line) return null;
          var qty='', desc='', unitPrice='', total='';
          var m = line.match(/^(\d+)\s*[x×]\s*(.+?)(?:\s*@\s*([\d,\.]+))?$/i);
          if(m){ qty = m[1]; desc = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; return {qty, desc, unitPrice, total}; }
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,\.]+))?/);
          if(m){ desc = m[1].trim(); qty = m[2].trim(); unitPrice = m[3] ? m[3].trim() : ''; return {qty, desc, unitPrice, total}; }
          var parts = line.split(/\s*\|\s*/); if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          parts = line.split(/\s*,\s*/); if(parts.length >= 2){ desc = parts[0].trim(); qty = parts[1].trim(); unitPrice = parts[2] ? parts[2].trim() : ''; return {qty, desc, unitPrice, total}; }
          m = line.match(/^(\d+)\s+(.+)$/); if(m){ qty = m[1]; desc = m[2].trim(); return {qty, desc, unitPrice, total}; }
          desc = line; return {qty, desc, unitPrice, total};
        }
        function normalize(src){ if(!src) return []; if(Array.isArray(src)) return src.map(it=>({qty:it.qty||'', desc:it.description||it.name||'', unitPrice:it.unitPrice||it.price||'', total:it.total||''}));
          var raw = String(src||''); var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){return l.trim();}).filter(Boolean); var out=[]; for(var i=0;i<lines.length;i++){ var item = parseLine(lines[i]); if(item) out.push(item); } return out; }
        function renderRows(items){ return items.map(function(it){ return '<tr><td>'+escapeHtml(it.desc)+'</td><td class="price">'+escapeHtml(it.unitPrice||'')+'</td><td class="price">'+escapeHtml(it.qty||'')+'</td></tr>'; }).join(''); }
        try{ var tbody = document.querySelector('table.items tbody'); if(!tbody) return; if(tbody.querySelector('tr')) return; var raw = tbody.textContent || ''; var table = document.querySelector('table.items'); var dataItems = table && table.getAttribute('data-items'); var itemsSource = (dataItems && dataItems.trim()) || raw; var items = normalize(itemsSource); if(items.length) tbody.innerHTML = renderRows(items); }catch(e){ console.error('items normalizer error', e); }
      })();
    </script>
  </body>
  </html>`
    }
  ];

  export function getTemplateById(id) {
    return TEMPLATES.find((t) => t.id === id) || null;
  }

  /* Row 2: Colour Accent */
  /* ---------- Accent 1: Diagonal / red banner (fixed item placement) ---------- */
  {
    id: "accent-1",
    category: "accent",
    name: "Accent Diagonal",
    thumbnail: "/templates/accent-1.png",
    description: "Diagonal banner accent; bold red, clear totals and payment area.",
    options: { width: 720, qr: false },
    style: { accentColor: "#e11d48", headerBg: "#ffffff", textColor: "#07131a", suggestedWidth: 720 },
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
  <title>Invoice — Accent Diagonal</title>
  <style>
    :root{ --w:720px; --pad:18px; --red:#e11d48; --muted:#6b7280; --text:#07131a; --paper:#ffffff; --base: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    *{box-sizing:border-box}
    body{font-family:var(--base); background:#f5f5f7; padding:24px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
    .wrap{width:var(--w); display:block;}
    .card{background:var(--paper); border-radius:12px; overflow:hidden; box-shadow:0 20px 50px rgba(10,12,20,0.08);}
    .accent{position:relative; padding:var(--pad) 24px 22px 24px;}
    .accent::before{content:""; position:absolute; left:-120px; top:-40px; width:420px; height:240px; transform:rotate(-18deg); background:linear-gradient(90deg,var(--red), #c81a42); border-radius:8px; box-shadow:0 8px 20px rgba(225,29,72,0.08);}
    .hdr{position:relative; z-index:2; display:flex; justify-content:space-between; align-items:center; gap:14px;}
    .brand{display:flex; gap:12px; align-items:center;}
    .logo{height:56px; width:56px; object-fit:contain; background:#fff; padding:6px; border-radius:8px;}
    .company{font-weight:900; font-size:18px; color:var(--text);}
    .tag{font-size:13px; color:var(--muted);}
    .invoiceLabel{position:relative; z-index:2; text-align:right;}
    .invoiceLabel .title{font-weight:900; font-size:22px; color:rgba(255,255,255,0.98); padding:8px 12px; border-radius:6px; display:inline-block;}
    .body{position:relative; z-index:2; padding:18px 24px 28px 24px; background:linear-gradient(180deg, rgba(255,255,255,0.00), rgba(255,255,255,0.95));}
    .grid{display:flex; justify-content:space-between; gap:20px; margin-top:6px;}
    .items{width:100%; border-collapse:collapse; margin-top:16px; font-size:14px;}
    .items thead th{font-weight:700; text-align:left; padding:12px 8px; color:var(--muted); border-bottom:3px solid rgba(0,0,0,0.06);}
    .items td{padding:12px 8px; border-bottom:2px solid rgba(0,0,0,0.06); vertical-align:middle; text-align:left;}
    .items td.right{text-align:right}
    .summaryRow{display:flex; justify-content:flex-end; margin-top:14px; gap:18px;}
    .summaryVal{font-weight:900; font-size:18px; color:var(--text);}
    .payment{margin-top:18px; display:flex; justify-content:space-between; gap:16px; align-items:center;}
    .payment .left{font-size:13px; color:var(--muted)}
    .payment .cta{background:var(--red); color:white; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:800;}
    .footer{padding:14px 24px; background:#fff; border-top:1px solid rgba(0,0,0,0.04); display:flex; justify-content:space-between; align-items:center; gap:12px;}
    .notes{font-size:13px; color:var(--muted)}
    @media print{ body{background:transparent} .card{box-shadow:none} .accent::before{display:none} }
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="accent" role="article" aria-label="Invoice">
          <div class="hdr">
            <div class="brand">
              <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
              <div>
                <div class="company">{{sellerName}}</div>
                <div class="tag">{{sellerTagline}}</div>
              </div>
            </div>
            <div class="invoiceLabel">
              <div class="title">INVOICE</div>
              <div style="font-size:13px; color:#fff; opacity:0.95; margin-top:6px;">#{{invoiceNumber}} • {{date}}</div>
            </div>
          </div>

          <div class="body">
            <div class="grid" aria-hidden="false">
              <div>
                <div style="font-weight:700; margin-bottom:6px;">Bill to</div>
                <div class="metaSmall">{{buyerName}} • {{buyerPhone}}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px; color:var(--muted)">Due</div>
                <div style="font-weight:700;">{{dueDate}}</div>
              </div>
            </div>

            <table class="items" aria-label="Line items">
              <thead>
                <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr>
              </thead>
              <tbody id="items-accent-1">
                {{itemsRows}}
              </tbody>
            </table>

            <div class="summaryRow">
              <div style="text-align:right;">
                <div style="color:var(--muted); font-size:13px;">Subtotal</div>
                <div class="summaryVal">{{subtotal}}</div>
              </div>
            </div>

            <div class="payment" role="region" aria-label="Payment details">
              <div class="left">
                <div style="font-weight:700; margin-bottom:6px;">Payment method</div>
                <div style="font-weight:800;">{{paymentLabel}} • {{paymentNumber}}</div>
                <div style="font-size:12px; color:var(--muted); margin-top:6px;">{{paymentNote}}</div>
              </div>
              <div style="text-align:right;">
                <a class="cta" href="{{payLink}}">Pay now</a>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="notes">{{notesLine}}</div>
            <div style="font-size:12px; color:var(--muted)">Sent via DollarChain</div>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Robust fallback: parse plain-text items into proper table rows.
      (function normalizeItems(tbodyId){
        function parseLine(line){
          line = line.trim();
          if(!line) return null;
          // Patterns:
          // "2x Jacket" or "2 x Jacket"
          var m = line.match(/^(\d+)\s*[x×]\s*(.+)$/i);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          // "Jacket - 2 - 1500" or "Jacket - 2"
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,.]+))?$/);
          if(m) return {desc: m[1].trim(), qty: m[2].trim(), unit: (m[3]||'').trim()};
          // "desc | qty | unit"
          var parts = line.split(/\s*\|\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          // "desc,qty,unit"
          parts = line.split(/\s*,\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          // "2 Jacket" -> number first
          m = line.match(/^(\d+)\s+(.+)$/);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          // fallback: everything as description
          return {desc: line, qty: ''};
        }

        var tbody = document.getElementById(tbodyId);
        if(!tbody) return;
        // if there are already <tr> rows, assume the system produced correct markup.
        if(tbody.querySelector('tr')) return;
        var raw = tbody.textContent || '';
        var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){ return l.trim(); }).filter(Boolean);
        if(lines.length === 0) return;
        var frag = document.createDocumentFragment();
        lines.forEach(function(line){
          var item = parseLine(line);
          if(!item) return;
          var tr = document.createElement('tr');
          var tdDesc = document.createElement('td'); tdDesc.textContent = item.desc || '';
          var tdQty = document.createElement('td'); tdQty.className = 'right'; tdQty.textContent = item.qty || '';
          var tdUnit = document.createElement('td'); tdUnit.className = 'right'; tdUnit.textContent = item.unit || '';
          var tdTotal = document.createElement('td'); tdTotal.className = 'right'; tdTotal.textContent = '';
          tr.appendChild(tdDesc); tr.appendChild(tdQty); tr.appendChild(tdUnit); tr.appendChild(tdTotal);
          frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
      })('items-accent-1');
    </script>
  </body>
  </html>`
  },

  /* ---------- Accent 2: Studio / navy header (fixed item placement) ---------- */
  {
    id: "accent-2",
    category: "accent",
    name: "Accent Studio",
    thumbnail: "/templates/accent-2.png",
    description: "Large navy header, orange INVOICE title, compact service table and clear payment block.",
    options: { width: 720, qr: false },
    style: { accentColor: "#2b2b7a", headerBg: "#2b2b7a", textColor: "#07131a", suggestedWidth: 720 },
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
  <title>Invoice — Accent Studio</title>
  <style>
    :root{ --w:720px; --pad:20px; --navy:#2b2b7a; --orange:#ff9b3b; --muted:#6b7280; --text:#07131a; --base: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    *{box-sizing:border-box}
    body{font-family:var(--base); background:#f7f8fb; padding:26px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
    .card{width:var(--w); background:white; border-radius:10px; overflow:hidden; box-shadow:0 18px 48px rgba(12,14,20,0.06);}
    .band{background:var(--navy); color:white; padding:20px 28px; display:flex; justify-content:space-between; align-items:center; gap:12px;}
    .band .title{font-weight:900; font-size:36px; color:var(--orange); letter-spacing:1px;}
    .band .contact{font-size:13px; opacity:0.95;}
    .main{padding:22px 28px;}
    .topRow{display:flex; justify-content:space-between; gap:16px; align-items:flex-start;}
    .bill{font-size:14px; color:var(--muted); white-space:pre-line;}
    .items{width:100%; border-collapse:collapse; margin-top:18px; font-size:13px;}
    .items thead th{font-weight:700; color:var(--muted); padding:10px 8px; border-bottom:2px solid #eef2f8; text-align:left;}
    .items td{padding:10px 8px; border-bottom:1px solid #f1f5f9;}
    .items td.right{text-align:right}
    .serviceGrid{display:grid; grid-template-columns:1fr auto; gap:12px; margin-top:16px;}
    .paymentBox{margin-top:18px; background:#f6f8ff; padding:14px; border-radius:10px; border:1px solid rgba(43,43,122,0.06); display:flex; justify-content:space-between; align-items:center;}
    .totals{margin-top:18px; display:flex; justify-content:flex-end; gap:18px; align-items:end;}
    .totalVal{font-weight:900; font-size:20px; color:var(--text);}
    .footer{padding:18px 28px; border-top:1px solid #f1f3f6; display:flex; justify-content:space-between; align-items:center;}
    .mutedSmall{font-size:13px;color:var(--muted)}
    @media print{ .card{box-shadow:none} .band{box-shadow:none} }
  </style>
  </head>
  <body>
    <div class="card" role="article" aria-label="Invoice">
      <div class="band" aria-hidden="false">
        <div style="display:flex; gap:14px; align-items:center;">
          <div style="font-size:12px; opacity:0.95;">(210) 788-8829</div>
          <div style="font-size:12px; opacity:0.95;">|</div>
          <div style="font-size:12px; opacity:0.95;">www.designstudio.com</div>
        </div>
        <div style="text-align:right;">
          <div class="title">INVOICE</div>
          <div style="font-size:12px; opacity:0.95;">{{date}}</div>
        </div>
      </div>

      <div class="main">
        <div class="topRow">
          <div>
            <div style="font-weight:900; font-size:18px;">Bill To</div>
            <div class="bill">{{buyerName}}<div style="margin-top:6px; color:var(--muted)">{{buyerPhone}}</div></div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:13px; color:var(--muted)">Invoice Number</div>
            <div style="font-weight:800;">#{{invoiceNumber}}</div>
            <div style="margin-top:8px; font-size:13px; color:var(--muted)">Due</div>
            <div style="font-weight:700;">{{dueDate}}</div>
          </div>
        </div>

        <div class="serviceGrid">
          <div>
            <table class="items" aria-label="Service details">
              <thead>
                <tr><th style="width:60%">Description of Service</th><th style="text-align:right">Quantity</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr>
              </thead>
              <tbody id="items-accent-2">
                {{itemsRows}}
              </tbody>
            </table>
          </div>

          <div style="max-width:280px;">
            <div style="background:white; border-radius:10px; padding:12px; border:1px solid #eef2f8;">
              <div style="font-size:13px; color:var(--muted)">Payment Information</div>
              <div style="margin-top:8px;">
                <div style="font-weight:800;">{{paymentLabel}}</div>
                <div style="font-size:13px; color:var(--muted); margin-top:6px">{{paymentNumber}}</div>
              </div>

              <div style="margin-top:12px; display:flex; justify-content:space-between; gap:8px;">
                <div style="color:var(--muted); font-size:13px;">Subtotal</div><div style="font-weight:800;">{{subtotal}}</div>
              </div>
              <div style="display:flex; justify-content:space-between; gap:8px; margin-top:6px; color:var(--muted); font-size:13px;">
                <div>Tax ({{vatPercent}}%)</div><div>{{vatAmount}}</div>
              </div>
              <div style="border-top:1px dashed #eef2f8; margin-top:10px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:900;">Total</div><div style="font-weight:900; font-size:18px;">{{total}}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:18px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:13px; color:var(--muted)">{{notesLine}}</div>
          <div style="text-align:right; color:var(--muted)">Sent via DollarChain</div>
        </div>
      </div>

      <div class="footer">
        <div style="font-size:13px; color:var(--muted)">Terms and Conditions: Payment due on receipt. Late fees may apply.</div>
        <div style="font-weight:800; font-size:13px;">Signature</div>
      </div>
    </div>

    <script>
      (function normalizeItems(tbodyId){
        function parseLine(line){
          line = line.trim();
          if(!line) return null;
          var m = line.match(/^(\d+)\s*[x×]\s*(.+)$/i);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,.]+))?$/);
          if(m) return {desc: m[1].trim(), qty: m[2].trim(), unit: (m[3]||'').trim()};
          var parts = line.split(/\s*\|\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          parts = line.split(/\s*,\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          m = line.match(/^(\d+)\s+(.+)$/);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          return {desc: line, qty: ''};
        }

        var tbody = document.getElementById(tbodyId);
        if(!tbody) return;
        if(tbody.querySelector('tr')) return;
        var raw = tbody.textContent || '';
        var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){ return l.trim(); }).filter(Boolean);
        if(lines.length === 0) return;
        var frag = document.createDocumentFragment();
        lines.forEach(function(line){
          var item = parseLine(line);
          if(!item) return;
          var tr = document.createElement('tr');
          var tdDesc = document.createElement('td'); tdDesc.textContent = item.desc || '';
          var tdQty = document.createElement('td'); tdQty.className = 'right'; tdQty.textContent = item.qty || '';
          var tdUnit = document.createElement('td'); tdUnit.className = 'right'; tdUnit.textContent = item.unit || '';
          var tdTotal = document.createElement('td'); tdTotal.className = 'right'; tdTotal.textContent = '';
          tr.appendChild(tdDesc); tr.appendChild(tdQty); tr.appendChild(tdUnit); tr.appendChild(tdTotal);
          frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
      })('items-accent-2');
    </script>
  </body>
  </html>`
  },

  /* ---------- Accent 3: Right ribbon (fixed item placement) ---------- */
  {
    id: "accent-3",
    category: "accent",
    name: "Accent Right Ribbon",
    thumbnail: "/templates/accent-3.png",
    description: "Muted grey main card with a red right-hand ribbon for totals and CTAs.",
    options: { width: 780, qr: false },
    style: { accentColor: "#ef4444", headerBg: "#f7f7f9", textColor: "#07131a", suggestedWidth: 780 },
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
  <title>Invoice — Accent Right Ribbon</title>
  <style>
    :root{ --w:780px; --pad:18px; --accent:#ef4444; --muted:#6b7280; --text:#07131a; --cardbg:#f6f7f9; --base: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    *{box-sizing:border-box}
    body{font-family:var(--base); background:#efeff2; padding:26px; display:flex; justify-content:center; -webkit-font-smoothing:antialiased;}
    .wrap{width:var(--w); display:flex; justify-content:center;}
    .card{display:flex; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 18px 40px rgba(10,12,20,0.06); width:100%;}
    .main{flex:1; padding:var(--pad) 20px; background:var(--cardbg);}
    .ribbon{width:220px; background:linear-gradient(180deg,var(--accent), #c53030); color:white; padding:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;}
    .ribbon .ttl{font-weight:900; font-size:20px; letter-spacing:0.6px;}
    .ribbon .totalAmt{font-weight:900; font-size:26px;}
    .hdr{display:flex; justify-content:space-between; align-items:center; gap:12px;}
    .logo{height:56px; width:56px; object-fit:contain; background:#fff; padding:6px; border-radius:8px;}
    .company{font-weight:800; font-size:16px; color:var(--text);}
    .meta{font-size:13px; color:var(--muted)}
    .items{width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; background:white; border-radius:8px; overflow:hidden;}
    .items thead th{font-weight:700; color:var(--muted); text-align:left; padding:12px 10px; border-bottom:2px solid #eef2f7;}
    .items td{padding:12px 10px; border-bottom:1px solid #f3f5f8;}
    .items td.right{text-align:right}
    .items tbody tr:last-child td{border-bottom:1px dashed #e8eaee;}
    .payment{margin-top:16px; display:flex; gap:12px; align-items:center; justify-content:space-between;}
    .payBtn{background:var(--accent); color:white; padding:10px 14px; border-radius:8px; font-weight:800; text-decoration:none;}
    .foot{margin-top:18px; font-size:13px; color:var(--muted); display:flex; justify-content:space-between;}
    @media print{ .card{box-shadow:none} .ribbon{background:var(--accent)} }
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card" role="article" aria-label="Invoice">
        <div class="main">
          <div class="hdr">
            <div style="display:flex; gap:12px; align-items:center;">
              <img src="{{sellerLogoUrl}}" alt="{{sellerName}} logo" class="logo" onerror="this.style.display='none'"/>
              <div>
                <div class="company">{{sellerName}}</div>
                <div class="meta">{{sellerAddress}}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:900; font-size:18px;">Invoice</div>
              <div style="font-size:13px; color:var(--muted)">#{{invoiceNumber}} • {{date}}</div>
            </div>
          </div>

          <div style="margin-top:10px; display:flex; justify-content:space-between; gap:18px;">
            <div>
              <div style="font-weight:700;">Bill to</div>
              <div style="font-size:13px; color:var(--muted)">{{buyerName}} • {{buyerPhone}}</div>
            </div>
            <div style="text-align:right; color:var(--muted)">
              <div>Due</div><div style="font-weight:700;">{{dueDate}}</div>
            </div>
          </div>

          <table class="items" aria-label="Line items">
            <thead>
              <tr><th style="width:55%">Item</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody id="items-accent-3">
              {{itemsRows}}
            </tbody>
          </table>

          <div class="payment">
            <div style="font-size:13px; color:var(--muted)">{{notesLine}}</div>
            <div style="text-align:right;">
              <div style="color:var(--muted); font-size:13px;">Payment method</div>
              <div style="font-weight:800; margin-top:6px;">{{paymentLabel}} • {{paymentNumber}}</div>
            </div>
          </div>

          <div class="foot">
            <div>Sent via DollarChain</div>
            <div style="color:var(--muted)">{{date}}</div>
          </div>
        </div>

        <aside class="ribbon" role="complementary" aria-label="Totals">
          <div style="text-transform:uppercase; opacity:0.9; font-size:12px;">Grand Total</div>
          <div class="totalAmt">{{total}}</div>
          <a class="payBtn" href="{{payLink}}">Pay Now</a>
          <div style="font-size:12px; opacity:0.95;">Due: {{dueDate}}</div>
        </aside>
      </div>
    </div>

    <script>
      (function normalizeItems(tbodyId){
        function parseLine(line){
          line = line.trim();
          if(!line) return null;
          var m = line.match(/^(\d+)\s*[x×]\s*(.+)$/i);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          m = line.match(/^(.+?)\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*([\d,.]+))?$/);
          if(m) return {desc: m[1].trim(), qty: m[2].trim(), unit: (m[3]||'').trim()};
          var parts = line.split(/\s*\|\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          parts = line.split(/\s*,\s*/);
          if(parts.length >= 2) return {desc: parts[0].trim(), qty: parts[1].trim(), unit: (parts[2]||'').trim()};
          m = line.match(/^(\d+)\s+(.+)$/);
          if(m) return {desc: m[2].trim(), qty: m[1].trim()};
          return {desc: line, qty: ''};
        }

        var tbody = document.getElementById(tbodyId);
        if(!tbody) return;
        if(tbody.querySelector('tr')) return;
        var raw = tbody.textContent || '';
        var lines = raw.split(/[\r\n]+|[,•·]+/).map(function(l){ return l.trim(); }).filter(Boolean);
        if(lines.length === 0) return;
        var frag = document.createDocumentFragment();
        lines.forEach(function(line){
          var item = parseLine(line);
          if(!item) return;
          var tr = document.createElement('tr');
          var tdDesc = document.createElement('td'); tdDesc.textContent = item.desc || '';
          var tdUnitPrice = document.createElement('td'); tdUnitPrice.className = 'right'; tdUnitPrice.textContent = item.unit || '';
          var tdQty = document.createElement('td'); tdQty.className = 'right'; tdQty.textContent = item.qty || '';
          var tdTotal = document.createElement('td'); tdTotal.className = 'right'; tdTotal.textContent = '';
          tr.appendChild(tdDesc); tr.appendChild(tdUnitPrice); tr.appendChild(tdQty); tr.appendChild(tdTotal);
          frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
      })('items-accent-3');
    </script>
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
