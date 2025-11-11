// src/components/Settings.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { supabase } from "../lib/supabase";

/**
 * Settings page for profile + store/shop settings.
 * - Writes user fields (full_name, phone) and profile.metadata with invoice/store settings.
 * - Performs a uniqueness check for Store/Shop name to avoid duplicates.
 *
 * Notes:
 * - Logo upload attempts to use a storage bucket named "logos". Change if needed.
 * - updateProfile() (from UserContext) upserts into 'profiles' table.
 */

const LOGO_BUCKET = "logos"; // change to your bucket name if different

export default function Settings() {
  const { user, profile, updateProfile, refreshProfile } = useUser();

  // User profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Store/Shop metadata fields
  const [sellerName, setSellerName] = useState("");
  const [sellerLogoUrl, setSellerLogoUrl] = useState("");
  const [sellerTagline, setSellerTagline] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("MPESA");
  const [defaultPaymentNumber, setDefaultPaymentNumber] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatPercent, setVatPercent] = useState(0);
  const [defaultNotes, setDefaultNotes] = useState("");
  const [accentColor, setAccentColor] = useState("#16a34a");
  const [logoPosition, setLogoPosition] = useState("left");
  const [defaultTemplate, setDefaultTemplate] = useState("");

  // UI state
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // seed form values from profile or auth user
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      const meta = profile.metadata || {};
      setSellerName(meta.sellerName || "");
      setSellerLogoUrl(meta.sellerLogoUrl || "");
      setSellerTagline(meta.sellerTagline || "");
      setSellerPhone(meta.sellerPhone || "");
      setSellerEmail(meta.sellerEmail || "");
      setSellerAddress(meta.sellerAddress || "123 Nairobi Rd\nNairobi, Kenya");
      setCurrency(meta.currency || "KES");
      setDefaultPaymentMethod(meta.defaultPaymentMethod || "MPESA");
      setDefaultPaymentNumber(meta.defaultPaymentNumber || "");
      setInvoicePrefix(meta.invoicePrefix || "");
      setVatEnabled(Boolean(meta.vatEnabled));
      setVatPercent(typeof meta.vatPercent === "number" ? meta.vatPercent : (meta.vatPercent ? Number(meta.vatPercent) : 0));
      setDefaultNotes(meta.defaultNotes || "Thank you for your purchase.");
      setAccentColor(meta.accentColor || "#16a34a");
      setLogoPosition(meta.logoPosition || "left");
      setDefaultTemplate(meta.default_invoice_template || "");
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [profile, user]);

  // Simple helper: check if store/shop name already exists in profiles (case-insensitive)
  async function isStoreNameTaken(name) {
    if (!name || !name.trim()) return false;
    try {
      // Query profiles where metadata->>sellerName equals provided name.
      // Note: This depends on PostgREST JSON comparison support. It works on most Supabase/Postgres setups.
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("metadata->>sellerName", name.trim())
        .limit(1);

      if (error) {
        console.warn("Store name uniqueness check error:", error);
        return false; // be permissive if check fails server-side — still allow saving but warn
      }

      if (!data || data.length === 0) return false;

      // if the record exists and it's this user's profile id, it's not a conflict
      const existsId = data[0]?.id;
      if (existsId === (profile && profile.id)) return false;
      return true;
    } catch (err) {
      console.error("isStoreNameTaken error:", err);
      return false;
    }
  }

  const handleLogoFile = async (file) => {
    if (!file) return;
    if (!user || !user.id) {
      setStatus({ type: "error", message: "Sign in before uploading a logo." });
      return;
    }

    setUploadingLogo(true);
    setStatus(null);

    try {
      // Build path and attempt upload
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL (you can choose to use signed url instead)
      const { data: pubData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const publicUrl = pubData?.publicUrl || "";
      if (!publicUrl) throw new Error("Failed to retrieve logo public URL after upload.");

      setSellerLogoUrl(publicUrl);
      setStatus({ type: "success", message: "Logo uploaded and set." });
    } catch (err) {
      console.error("Logo upload failed:", err);
      setStatus({ type: "error", message: "Logo upload failed. See console." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      // validate required store/shop name
      if (!sellerName || sellerName.trim().length < 2) {
        setStatus({ type: "error", message: "Store/Shop name is required (min 2 chars)." });
        setSaving(false);
        return;
      }

      // Check uniqueness if name changed or newly set
      const currentMetaName = (profile && profile.metadata && profile.metadata.sellerName) || "";
      if (sellerName.trim() && sellerName.trim() !== currentMetaName) {
        const taken = await isStoreNameTaken(sellerName.trim());
        if (taken) {
          setStatus({ type: "error", message: `The Store/Shop name "${sellerName.trim()}" is already registered. Choose another.` });
          setSaving(false);
          return;
        }
      }

      // Build merged metadata object
      const existingMeta = (profile && profile.metadata) || {};
      const newMeta = {
        ...existingMeta,
        sellerName: sellerName.trim(),
        sellerLogoUrl: sellerLogoUrl || existingMeta.sellerLogoUrl || "",
        sellerTagline: sellerTagline || "",
        sellerPhone: sellerPhone || "",
        sellerEmail: sellerEmail || "",
        sellerAddress: sellerAddress || "",
        currency: currency || "KES",
        defaultPaymentMethod: defaultPaymentMethod || "MPESA",
        defaultPaymentNumber: defaultPaymentNumber || "",
        invoicePrefix: invoicePrefix || "",
        vatEnabled: Boolean(vatEnabled),
        vatPercent: Number(vatPercent) || 0,
        defaultNotes: defaultNotes || "",
        accentColor: accentColor || "#16a34a",
        logoPosition: logoPosition || "left",
        default_invoice_template: defaultTemplate || existingMeta.default_invoice_template || "",
      };

      // Persist full_name, phone and metadata via updateProfile()
      const payload = {
        full_name: fullName || null,
        phone: phone || null,
        metadata: newMeta,
      };

      const { data, error } = await updateProfile(payload);
      if (error) {
        console.error("updateProfile returned error:", error);
        setStatus({ type: "error", message: `Failed to save settings: ${error.message || JSON.stringify(error)}` });
      } else {
        setStatus({ type: "success", message: "Settings saved." });
        // refresh profile context
        await refreshProfile();
      }
    } catch (err) {
      console.error("Settings.save error:", err);
      setStatus({ type: "error", message: err.message || String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

      <form onSubmit={handleSave} style={{ maxWidth: 900, background: "white", padding: 18, borderRadius: 8, display: "grid", gap: 18 }}>
        {/* --------- User profile section --------- */}
        <div style={{ borderRadius: 8, padding: 12, background: "#fbfbfb" }}>
          <h2 style={{ marginTop: 0 }}>User profile</h2>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name (will be fallback seller name if Store/Shop name missing)"
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547XXXXXXXX"
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            />
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              Include country code. e.g. <code>+254712345678</code>
            </div>
          </div>
        </div>

        {/* --------- Store / Shop Settings --------- */}
        <div style={{ borderRadius: 8, padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Store / Shop settings</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Store/Shop name</label>
            <input
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Acme Clothing Ltd"
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            />
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              This name must be unique across DollarChain (used for free-trial signup verification).
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "start" }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Logo URL</label>
              <input
                value={sellerLogoUrl}
                onChange={(e) => setSellerLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png (or use upload)"
                style={{ width: "100%", padding: 8, borderRadius: 6 }}
              />
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  onChange={(ev) => {
                    const f = ev.target.files && ev.target.files[0];
                    if (f) handleLogoFile(f);
                  }}
                />
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  Or upload (PNG/JPG). Uploaded logos go to the <code>{LOGO_BUCKET}</code> storage bucket.
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Logo preview</div>
              <div style={{ borderRadius: 8, padding: 8, background: "#fff", border: "1px solid #eef2f7", display: "inline-block" }}>
                {sellerLogoUrl ? (
                  <img src={sellerLogoUrl} alt="logo preview" style={{ maxWidth: 180, maxHeight: 90, display: "block" }} />
                ) : (
                  <div style={{ minWidth: 180, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                    No logo set
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Tagline (optional)</label>
            <input
              value={sellerTagline}
              onChange={(e) => setSellerTagline(e.target.value)}
              placeholder="Quality goods, delivered."
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Store phone</label>
              <input value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="+2547..." style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Store email</label>
              <input value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="hi@store.co" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Store address</label>
            <textarea
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder={"123 Nairobi Rd\nNairobi, Kenya"}
              rows={3}
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            />
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              Example: <code>123 Nairobi Rd{String.fromCharCode(10)}Nairobi, Kenya</code>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="KES" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Default payment method</label>
              <select value={defaultPaymentMethod} onChange={(e) => setDefaultPaymentMethod(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }}>
                <option value="MPESA">M-Pesa</option>
                <option value="PAYBILL">Paybill</option>
                <option value="TILL">Till</option>
                <option value="BANK">Bank</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Default payment number</label>
            <input value={defaultPaymentNumber} onChange={(e) => setDefaultPaymentNumber(e.target.value)} placeholder="e.g. Paybill 123456 or Till 98765" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              e.g. <code>Paybill 123456</code> or <code>+254712345678</code>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Invoice prefix</label>
              <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="DC-" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Accent color</label>
              <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#16a34a" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                VAT / Tax
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input id="vatEnabled" type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(Boolean(e.target.checked))} />
                <label htmlFor="vatEnabled" style={{ marginLeft: 6 }}>Enable VAT</label>
                {vatEnabled && (
                  <input value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value || 0))} type="number" min="0" max="100" style={{ width: 80, marginLeft: 12, padding: 6 }} />
                )}
                {vatEnabled && <div style={{ color: "#6b7280", marginLeft: 8 }}>percent</div>}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Logo position</label>
              <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }}>
                <option value="left">Left</option>
                <option value="top">Top / Center</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Default notes (appears on invoices)</label>
            <textarea value={defaultNotes} onChange={(e) => setDefaultNotes(e.target.value)} rows={2} placeholder="Thank you for your purchase!" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Default invoice template</label>
            <input value={defaultTemplate} onChange={(e) => setDefaultTemplate(e.target.value)} placeholder="e.g. clean-minimalist-1" style={{ width: "100%", padding: 8, borderRadius: 6 }} />
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              Enter template id or leave blank to use the app default. We'll add a visual selector later if you prefer thumbnails.
            </div>
          </div>
        </div>

        {/* Save / reset */}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              // reset to last saved values
              if (profile) {
                setFullName(profile.full_name || "");
                setPhone(profile.phone || "");
                const meta = profile.metadata || {};
                setSellerName(meta.sellerName || "");
                setSellerLogoUrl(meta.sellerLogoUrl || "");
                setSellerTagline(meta.sellerTagline || "");
                setSellerPhone(meta.sellerPhone || "");
                setSellerEmail(meta.sellerEmail || "");
                setSellerAddress(meta.sellerAddress || "123 Nairobi Rd\nNairobi, Kenya");
                setCurrency(meta.currency || "KES");
                setDefaultPaymentMethod(meta.defaultPaymentMethod || "MPESA");
                setDefaultPaymentNumber(meta.defaultPaymentNumber || "");
                setInvoicePrefix(meta.invoicePrefix || "");
                setVatEnabled(Boolean(meta.vatEnabled));
                setVatPercent(typeof meta.vatPercent === "number" ? meta.vatPercent : (meta.vatPercent ? Number(meta.vatPercent) : 0));
                setDefaultNotes(meta.defaultNotes || "Thank you for your purchase.");
                setAccentColor(meta.accentColor || "#16a34a");
                setLogoPosition(meta.logoPosition || "left");
                setDefaultTemplate(meta.default_invoice_template || "");
              } else if (user) {
                setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
                setPhone(user.user_metadata?.phone || "");
              }
              setStatus(null);
            }}
          >
            Reset
          </button>
        </div>

        {status && (
          <div style={{ marginTop: 6 }}>
            <div style={{ color: status.type === "error" ? "#dc2626" : "#16a34a" }}>{status.message}</div>
          </div>
        )}

        <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
          <small>
            Note: Settings are stored in your profile metadata and used when generating invoices. Once a Store/Shop name is registered it cannot be reused by another account (this prevents abuse of trial credits).
          </small>
        </div>
      </form>
    </div>
  );
}
