// src/lib/parser.js
import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Lightweight deterministic parser for WhatsApp order messages.
 * Returns:
 * {
 *  rawText,
 *  buyerName,
 *  phone,
 *  items: [{name, qty}],
 *  total,
 *  confidence: { phone: 0-1, items: 0-1, name: 0-1, total: 0-1, overall: 0-1 },
 *  notes: [ ...strings ]
 * }
 */

const PRICE_RE = /(?:KES|KSh|KES\.?|KES|USD|\$|£)?\s?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/gi;

// Heuristics for name extraction
function extractName(text) {
  // Look for "Hi John", "Hello John", "Hey John"
  let m = text.match(/(?:^|\n|\b)(?:Hi|Hello|Hey)\s+([A-Z][a-z]{1,}\b(?:\s[A-Z][a-z]{1,})?)/i);
  if (m) return m[1].trim();

  // "Name: John", "Buyer: John"
  m = text.match(/(?:Name|Buyer|Customer|Client)[:\-\s]{1,}\s*([A-Z][\w\s]{1,40})/i);
  if (m) return m[1].trim();

  // Terminal signature style: "- John" or "— John"
  m = text.match(/[-–—]\s*([A-Z][a-z]{1,}\b(?:\s[A-Z][a-z]{1,})?)\s*$/m);
  if (m) return m[1].trim();

  // Common two-word names in caps or Titlecase somewhere (fallback)
  m = text.match(/\b([A-Z][a-z]{1,}\s+[A-Z][a-z]{1,})\b/);
  if (m) return m[1].trim();

  return "";
}

function splitItems(text) {
  const cleaned = text.replace(/\band\b/gi, ",").replace(/\s*&\s*/g, ",");
  const parts = cleaned.split(",").map(s => s.trim()).filter(Boolean);
  return parts;
}

function parseItemSegment(segment) {
  segment = segment.replace(/^(i\s+want|i'd like|i want to buy|please get me|pls|please)\s+/i, "").trim();

  // "3x T-Shirts" or "3 x T-Shirts" or "3 T-Shirts"
  let m = segment.match(/^\s*(\d+)\s*(?:x|pcs|pieces|pairs|items)?\s*(?:of\s+)?(.+)$/i);
  if (m) return { name: m[2].trim(), qty: parseInt(m[1], 10) };

  // "T-Shirt x3"
  m = segment.match(/^(.+?)\s+x\s*(\d+)\s*$/i);
  if (m) return { name: m[1].trim(), qty: parseInt(m[2], 10) };

  // "3 pairs of trousers"
  m = segment.match(/(\d+)\s+(pairs|pcs|pieces|items|bottles|boxes)?(?:\s+of)?\s+(.+)$/i);
  if (m) return { name: m[3].trim(), qty: parseInt(m[1], 10) };

  // find a number inside
  m = segment.match(/(\d+)\s+(.+)/);
  if (m) return { name: m[2].trim(), qty: parseInt(m[1], 10) };

  return { name: segment, qty: 1 };
}

function scoreItems(items) {
  if (!items || items.length === 0) return 0;
  let withQty = 0;
  for (const it of items) {
    if (it.qty && it.qty > 0) withQty++;
  }
  // percent of items with qty detected
  return Math.min(1, withQty / items.length);
}

export function parseOrderText(text = "") {
  const raw = (text || "").trim();
  if (!raw) {
    return {
      rawText: "",
      buyerName: "",
      phone: "",
      items: [],
      total: "",
      confidence: { phone: 0, items: 0, name: 0, total: 0, overall: 0 },
      notes: ["Empty message"]
    };
  }

  const notes = [];

  // Phone: use libphonenumber-js to parse & format
  let phone = "";
  let phoneScore = 0;
  const phoneCandidates = (raw.match(/(\+?\d[\d\s\-]{6,}\d)/g) || []).map(s => s.replace(/\s+/g, ""));
  for (const cand of phoneCandidates) {
    try {
      const pn = parsePhoneNumberFromString(cand);
      if (pn && pn.isValid && pn.isValid()) {
        phone = pn.number; // E.164
        phoneScore = 1;
        break;
      }
    } catch (e) {
      // ignore invalid candidate
    }
  }
  if (!phone && phoneCandidates.length) {
    // try last candidate even if not validated — lower confidence
    phone = phoneCandidates[phoneCandidates.length - 1];
    phoneScore = 0.4;
    notes.push("Phone found but format uncertain");
  }

  // Total: find price-like strings, take last as likely total
  const prices = [...raw.matchAll(PRICE_RE)].map(m => m[0].trim());
  const total = prices.length ? prices[prices.length - 1] : "";
  const totalScore = total ? 1 : 0;

  // Buyer name heuristics
  const buyerName = extractName(raw);
  const nameScore = buyerName ? 1 : 0;

  if (!buyerName) {
    notes.push("Buyer name not found automatically");
  }

  // Items extraction: heuristics around "I want" or "Order:" or fallback to text without phone/price bits
  let itemsCandidate = raw;
  const orderMatch = raw.match(/(?:Order|Items|List|My order)[:\-]\s*(.+)$/i);
  if (orderMatch) {
    itemsCandidate = orderMatch[1];
  } else {
    const wantMatch = raw.match(/(?:I want|I'd like|want|please|pls|order me|can i get)\s+(.+)$/i);
    if (wantMatch) itemsCandidate = wantMatch[1];
    else {
      // remove phone and price fragments so splitting is cleaner
      itemsCandidate = raw.replace(/(\+?\d[\d\s\-]{6,}\d)/g, "").replace(PRICE_RE, "").trim();
    }
  }

  // Split into possible item segments
  const segments = splitItems(itemsCandidate).filter(s => s.length > 1);

  const items = segments.map(s => {
    const p = parseItemSegment(s);
    return { name: p.name.replace(/^(of|a|the)\s+/i, "").trim(), qty: p.qty || 1, raw: s };
  }).filter(Boolean);

  const itemsScore = scoreItems(items);
  if (items.length === 0) notes.push("No item lines detected");

  // Overall score: avg
  const overall = +( (phoneScore + (itemsScore) + nameScore + totalScore) / 4 ).toFixed(2);

  return {
    rawText: raw,
    buyerName,
    phone,
    items,
    total,
    confidence: {
      phone: +phoneScore.toFixed(2),
      items: +itemsScore.toFixed(2),
      name: +nameScore.toFixed(2),
      total: +totalScore.toFixed(2),
      overall
    },
    notes
  };
}

export default parseOrderText;
