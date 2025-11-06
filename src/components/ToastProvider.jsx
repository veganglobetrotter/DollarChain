// src/components/ToastProvider.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import "./Toast.css";

/**
 * Usage:
 *  const { addToast } = useToasts();
 *  addToast({ type: 'success'|'info'|'warning'|'error', title, message, actionLabel, onAction, durationMs })
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((opts) => {
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const toast = {
      id,
      type: opts.type || "info",
      title: opts.title || "",
      message: opts.message || "",
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
      duration: typeof opts.durationMs === "number" ? opts.durationMs : 4500,
      createdAt: Date.now(),
    };
    setToasts((s) => [toast, ...s].slice(0, 6)); // keep recent 6
    if (toast.duration > 0) {
      setTimeout(() => removeToast(id), toast.duration);
    }
    return id;
  }, [removeToast]);

  // keyboard: dismiss newest on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setToasts((s) => s.slice(1)); // remove newest
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}

/* ToastViewport: fixed container rendering toasts bottom-right (desktop) / bottom-center (mobile) */
function ToastViewport({ toasts, onRemove }) {
  return (
    <div className="toast-viewport" role="region" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status" aria-describedby={`toast-${t.id}`}>
          <div className="toast-body">
            <div className="toast-left">
              <div className="toast-title">{t.title}</div>
              {t.message ? <div id={`toast-${t.id}`} className="toast-message">{t.message}</div> : null}
            </div>

            <div className="toast-actions">
              {t.actionLabel ? (
                <button
                  className="toast-action"
                  onClick={() => {
                    try { t.onAction && t.onAction(); } catch (e) { console.error(e); }
                    onRemove(t.id);
                  }}
                >
                  {t.actionLabel}
                </button>
              ) : null}

              <button className="toast-close" onClick={() => onRemove(t.id)} aria-label="Dismiss notification">✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
