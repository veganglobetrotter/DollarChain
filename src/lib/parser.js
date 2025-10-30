// src/lib/parser.js
// Lightweight deterministic parser for WhatsApp order messages.
// Returns: { buyerName, phone, items: [{name, qty}], total, rawText }

const PHONE_RE = /(\+?\d{7,15}|\b0\d{6,12}\b)/g; // simple phone finder
const PRICE_RE = /(?:KES|KSh|KES\.?|KES|USD|\$|£)?\s?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/gi;

// Try to extract buyer name heuristically
function extractName(text) {
  // look for "Hi NAME" or "Hello NAME" or "Name: NAME" or "Buyer: NAME"
  let m = text.match(/(?:Hi|Hello|Hey)\s+([A-Z][a-z]{1,}\b(?:\s[A-Z][a-z]{1,})?)/i);
  if (m) return m[1].trim();

  m = text.match(/(?:Name|Buyer|Customer|Client)[:\-]\s*([A-Z][\w\s]{1,40})/i);
  if (m) return m[1].trim();

  // look for signature-like "— John" or "\nJohn" at end
  m = text.match(/[-–—]\s*([A-Z][a-z]{1,}\b(?:\s[A-Z][a-z]{1,})?)\s*$/m);
  if (m) return m[1].trim();

  return "";
}

// Normalize splitters: commas, " and ", " & "
function splitItems(text) {
  // Try to find a sub-string that looks like items: if sentence contains words like "want", "please", or numbers.
  // Fallback: use whole text.
  // We'll simply split by commas and " and " and " & "
  const cleaned = text.replace(/\band\b/gi, ",").replace(/\s*&\s*/g, ",");
  const parts = cleaned.split(",").map(s => s.trim()).filter(Boolean);
  return parts;
}

// parse single item like "3x caps", "2 pairs of trousers", "I want 1 tie"
function parseItemSegment(segment) {
  // remove leading verbs
  segment = segment.replace(/^(i\s+want|i'd like|i want to buy|please get me|pls|please)\s+/i, "").trim();

  // patterns: "3x T-Shirts", "3 x T-Shirts", "3 T-Shirts", "3 pairs of trousers"
  let qty = 1;
  let name = segment;

  // pattern: '3x item' or '3 x item' or '3 items' (qty at start)
  let m = segment.match(/^\s*(\d+)\s*(?:x|pcs|pieces|pairs|items)?\s*(?:of\s+)?(.+)$/i);
  if (m) {
    qty = parseInt(m[1], 10);
    name = m[2].trim();
    return { name, qty };
  }

  // pattern: 'item x3' or 'item x 3'
  m = segment.match(/^(.+?)\s+x\s*(\d+)\s*$/i);
  if (m) {
    name = m[1].trim();
    qty = parseInt(m[2], 10);
    return { name, qty };
  }

  // pattern: '3 pairs of trousers'
  m = segment.match(/(\d+)\s+(pairs|pcs|pieces|items|bottles|boxes)?(?:\s+of)?\s+(.+)$/i);
  if (m) {
    qty = parseInt(m[1], 10);
    name = m[3].trim();
    return { name, qty };
  }

  // fallback: try to find a number inside the segment
  m = segment.match(/(\d+)\s+(.+)/);
  if (m) {
    qty = parseInt(m[1], 10);
    name = m[2].trim();
    return { name, qty };
  }

  // fallback: treat as single item
  return { name: segment, qty: 1 };
}

export function parseOrderText(text = "") {
  const raw = (text || "").trim();
  if (!raw) return { rawText: "", buyerName: "", phone: "", items: [], total: "" };

  // phone
  const phones = (raw.match(PHONE_RE) || []).map(p => p.trim());
  const phone = phones.length ? phones[0] : "";

  // price / total (take last price-looking number as total)
  const priceMatches = [...raw.matchAll(PRICE_RE)].map(m => m[0].trim());
  const total = priceMatches.length ? priceMatches[priceMatches.length - 1] : "";

  // buyer name
  const buyerName = extractName(raw);

  // items: we will try to find a likely items substring
  // Heuristic: if text contains colon after a keyword "Order" or "Items", use substring after that
  let itemsCandidate = raw;
  const orderMatch = raw.match(/(?:Order|Items|List)[:\-]\s*(.+)$/i);
  if (orderMatch) {
    itemsCandidate = orderMatch[1];
  } else {
    // if sentence has "I want" or "please", try to get the part around it
    const wantMatch = raw.match(/(?:I want|I\'d like|want|please)\s+(.+)$/i);
    if (wantMatch) itemsCandidate = wantMatch[1];
    else {
      // fallback: use whole text but remove phone/price fragments
      itemsCandidate = raw.replace(PHONE_RE, "").replace(PRICE_RE, "").trim();
    }
  }

  // Split into segments
  const segments = splitItems(itemsCandidate);

  const items = segments.map(s => {
    const p = parseItemSegment(s);
    // drop tiny fragments like 'for' or 'to'
    if (!p.name || p.name.length < 2) return null;
    return { name: p.name.replace(/^(of|a|the)\s+/i, "").trim(), qty: p.qty || 1 };
  }).filter(Boolean);

  return {
    rawText: raw,
    buyerName,
    phone,
    items,
    total
  };
}

/* quick examples (for developer testing)
console.log(parseOrderText("Hi John, I want 3 pairs of trousers, 3 caps and 1 tie. Phone: +254712345678 Total KES 5,000"));
*/
export default parseOrderText;
