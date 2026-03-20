"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ nom: "", email: "", organisme: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Message envoyé !</h1>
          <p className="text-sm text-[var(--text-secondary)]">Nous vous répondons sous 24h.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="glass-card p-8 rounded-2xl w-full max-w-lg">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Contact</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Une question ? Écrivez-nous.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(["nom", "email", "organisme"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block capitalize">{field}</label>
              <input
                type={field === "email" ? "email" : "text"}
                required={field !== "organisme"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Message</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>
          {status === "error" && <p className="text-sm text-red-400">Erreur lors de l&apos;envoi. Réessayez.</p>}
          <button type="submit" disabled={status === "loading"} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
            {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
