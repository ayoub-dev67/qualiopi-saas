"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertCircle, CalendarDays } from "lucide-react";

interface FormationOption {
  id: string;
  ref: string;
  intitule: string;
}

interface FormateurOption {
  id: string;
  ref: string;
  nom: string;
  prenom: string;
}

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewSessionModal({ open, onClose }: NewSessionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");
  const [formations, setFormations] = useState<FormationOption[]>([]);
  const [formateurs, setFormateurs] = useState<FormateurOption[]>([]);

  const [formationId, setFormationId] = useState("");
  const [formateurId, setFormateurId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [lieu, setLieu] = useState("");
  const [modalite, setModalite] = useState("presentiel");
  const [nombrePlaces, setNombrePlaces] = useState("10");
  const [statut, setStatut] = useState("planifiee");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoadingOptions(true);
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFormations(data.formations || []);
          setFormateurs(data.formateurs || []);
        }
      })
      .catch(() => setError("Impossible de charger les formations et intervenants"))
      .finally(() => setLoadingOptions(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Close on Escape
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_id: formationId,
          formateur_id: formateurId,
          date_debut: dateDebut,
          date_fin: dateFin,
          lieu,
          modalite,
          nombre_places: Number(nombrePlaces) || 10,
          statut,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || "Erreur lors de la création");
        setLoading(false);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-colors";
  const labelClass = "text-xs font-medium text-[var(--text-secondary)] mb-1.5 block";

  const canCreateSession = formations.length > 0 && formateurs.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
              <CalendarDays size={16} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Nouvelle session</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loadingOptions ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--text-secondary)] mt-3">Chargement...</p>
            </div>
          ) : !canCreateSession ? (
            <div className="p-4 rounded-xl bg-[var(--warning-glow)] border border-[var(--warning)]/30">
              <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                Création impossible
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Vous devez d&apos;abord créer au moins une formation et un intervenant avant de pouvoir planifier une session.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--danger-glow)] border border-[var(--danger)]/30">
                  <AlertCircle size={16} className="text-[var(--danger)] shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--danger)]">{error}</span>
                </div>
              )}

              <div>
                <label className={labelClass}>Formation</label>
                <select
                  value={formationId}
                  onChange={(e) => setFormationId(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">-- Choisir une formation --</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.intitule}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Intervenant</label>
                <select
                  value={formateurId}
                  onChange={(e) => setFormateurId(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">-- Choisir un intervenant --</option>
                  {formateurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.prenom} {f.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date de début</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date de fin</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Lieu</label>
                <input
                  type="text"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  placeholder="Ex : Salle A, 15 rue de la Formation"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Modalité</label>
                  <select
                    value={modalite}
                    onChange={(e) => setModalite(e.target.value)}
                    className={inputClass}
                  >
                    <option value="presentiel">Présentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Places</label>
                  <input
                    type="number"
                    min={1}
                    value={nombrePlaces}
                    onChange={(e) => setNombrePlaces(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Statut</label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className={inputClass}
                >
                  <option value="planifiee">Planifiée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-shadow disabled:opacity-60"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? "Création..." : "Créer la session"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
