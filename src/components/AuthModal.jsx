// src/components/AuthModal.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "signup" or "magic"
  const [message, setMessage] = useState("");

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created — check your email for confirmation.");
        onAuthSuccess && onAuthSuccess();
      } else if (mode === "magic") {
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage("Check your email — we sent a sign-in link.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.session) onAuthSuccess && onAuthSuccess(data.session);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: "google" });
    } catch (err) {
      console.error(err);
      setMessage(err.message || "OAuth error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setMessage("");
    onClose && onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Sign in">
        <h3 style={{ marginTop: 0 }}>{mode === "signup" ? "Create an account" : mode === "magic" ? "Sign in with email" : "Sign in"}</h3>

        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />

        {mode !== "magic" && (
          <>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={styles.btnOutline} onClick={handleClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={submit} disabled={loading}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send sign-in link" : "Sign in"}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button style={styles.oauthBtn} onClick={signInWithGoogle}>Sign in with Google</button>
        </div>

        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          {message && <div style={{ marginBottom: 8 }}>{message}</div>}
          {mode === "signup" ? "Already have an account?" : "No account?"}{" "}
          <button style={styles.toggle} onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
          {" | "}
          <button style={styles.toggle} onClick={() => setMode(mode === "magic" ? "login" : "magic")}>
            {mode === "magic" ? "Use password" : "Use magic link"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10,11,12,0.35)",
    zIndex: 60,
  },
  modal: {
    width: 420,
    maxWidth: "94%",
    borderRadius: 12,
    background: "#fff",
    padding: 18,
    boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
  },
  label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600, color: "#114028" },
  input: { width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #e6e9ef" },
  btnPrimary: { background: "linear-gradient(180deg,#36b852,#1a8917)", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  btnOutline: { background: "transparent", border: "1px solid #e6e9ef", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  toggle: { background: "transparent", border: "none", color: "#1a8917", cursor: "pointer", fontWeight: 700 },
  oauthBtn: { background: "#fff", border: "1px solid #e6e9ef", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
};
