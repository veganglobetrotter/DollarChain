// src/components/AuthModal.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup" | "magic"
  const [message, setMessage] = useState("");

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!email || (mode !== "magic" && !password)) {
        setMessage("Please provide required fields.");
        return;
      }

      if (mode === "signup") {
        // Create account (does not guarantee immediate sign-in depending on Supabase settings)
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If supabase returns a session (rare depending on confirmation settings), call onAuthSuccess
        if (data?.session) {
          onAuthSuccess && onAuthSuccess(data.session);
        } else {
          setMessage("Account created — check your email to confirm and sign in.");
        }
      } else if (mode === "magic") {
        // Send magic link (OTP) and force redirect to production origin
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: "https://www.dollarchain.store" },
        });
        if (error) throw error;
        setMessage("Check your email — we've sent a sign-in link. After clicking it you'll return signed in.");
      } else {
        // Password sign-in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // signInWithPassword returns a session immediately on success
        if (data?.session) {
          onAuthSuccess && onAuthSuccess(data.session);
        } else {
          setMessage("Signed in (no session returned). Please refresh if UI did not update.");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setMessage(err?.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Ask Supabase to redirect back to current origin after OAuth flow
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      // After this call the browser will redirect to the provider; nothing more to do here.
    } catch (err) {
      console.error("OAuth error:", err);
      setMessage(err?.message || "OAuth error");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setMessage("");
    setLoading(false);
    onClose && onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Sign in">
        <h3 style={{ marginTop: 0 }}>
          {mode === "signup" ? "Create an account" : mode === "magic" ? "Sign in with email" : "Sign in"}
        </h3>

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          type="email"
          autoComplete="email"
        />

        {mode !== "magic" && (
          <>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={styles.btnOutline} onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button
            style={styles.btnPrimary}
            onClick={submit}
            disabled={loading || !email || (mode !== "magic" && !password)}
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send sign-in link" : "Sign in"}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button style={styles.oauthBtn} onClick={signInWithGoogle} disabled={loading}>
            Sign in with Google
          </button>
        </div>

        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          {message && <div style={{ marginBottom: 8 }}>{message}</div>}
          {mode === "signup" ? "Already have an account?" : "No account?"}{" "}
          <button
            style={styles.toggle}
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            disabled={loading}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
          {" | "}
          <button style={styles.toggle} onClick={() => setMode(mode === "magic" ? "login" : "magic")} disabled={loading}>
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
