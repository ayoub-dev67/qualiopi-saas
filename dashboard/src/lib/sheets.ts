const API_KEY = process.env.GOOGLE_API_KEY!;
const SHEET_01 = process.env.SHEET_01_ID!;
const SHEET_02 = process.env.SHEET_02_ID!;
const SHEET_03 = process.env.SHEET_03_ID!;

async function fetchSheet(sheetId: string, tabName: string): Promise<Record<string, string>[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}?key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 30 } });

  if (!res.ok) {
    console.error(`Sheets API error ${res.status} for tab "${tabName}"`);
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1)
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    })
    .filter((obj) => {
      const first = (obj[headers[0]] ?? "").trim();
      if (first === "") return false;
      if (first.startsWith("#")) return false;
      if (first === "Formula parse error") return false;
      return true;
    });
}

/** Convert Google Sheets decimal hour (0.006663…) to HH:MM:SS */
function convertDecimalHour(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num) || num < 0 || num >= 1) return val;
  const totalSeconds = Math.round(num * 24 * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Convert Google Sheets serial date (e.g. 46078) to YYYY-MM-DD */
function convertSerialDate(val: string): string {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1000 || num > 100000) return val;
  // Google Sheets epoch: 1899-12-30
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + num * 86400000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Check if value looks like a decimal number (corrupted cell) */
const DECIMAL_RE = /^\d+[.,]\d+$/;

// Sheet 01 - 01_Referentiel
export const getOrganisme  = () => fetchSheet(SHEET_01, "Organisme");
export const getFormations = () => fetchSheet(SHEET_01, "Formations");
export const getFormateurs = () => fetchSheet(SHEET_01, "Formateurs");
export const getSessions   = () => fetchSheet(SHEET_01, "Sessions");
export const getFinancier  = () => fetchSheet(SHEET_01, "Financier");
export const getConfig     = () => fetchSheet(SHEET_01, "Config");

// Sheet 02 - 02_Suivi_Apprenants
export const getApprenants      = () => fetchSheet(SHEET_02, "Apprenants");
export const getInscriptions    = () => fetchSheet(SHEET_02, "Inscriptions");
export const getPositionnements = () => fetchSheet(SHEET_02, "Positionnement");
export const getEmargement      = () => fetchSheet(SHEET_02, "Emargement");
export const getEvaluations     = () => fetchSheet(SHEET_02, "Evaluations");
export const getSatisfaction    = () => fetchSheet(SHEET_02, "Satisfaction");
export const getSuiviFroid      = () => fetchSheet(SHEET_02, "Suivi_Froid");
export const getReclamations    = () => fetchSheet(SHEET_02, "Reclamations");

// Sheet 03 - 03_Qualite_KPIs
export const getIndicateursQualiopi  = () => fetchSheet(SHEET_03, "Indicateurs_Qualiopi");
export const getKPIs                 = () => fetchSheet(SHEET_03, "KPIs");
export const getActionsAmelioration  = () => fetchSheet(SHEET_03, "Actions_Amelioration");

/** Journal with aggressive filtering + data conversion */
export async function getJournal() {
  const rows = await fetchSheet(SHEET_03, "Journal_Systeme");
  return rows
    .filter((r) => {
      // Filter empty/corrupted messages
      const msg = (r.message ?? "").trim();
      if (msg === "") return false;
      if (msg.includes("#NAME?") || msg.includes("#ERROR!") || msg.includes("#REF!")) return false;
      // Filter corrupted date (decimal number like "46078.006663")
      const date = (r.date ?? "").trim();
      if (DECIMAL_RE.test(date)) return false;
      // Filter corrupted session_id or heure containing "#"
      if ((r.session_id ?? "").includes("#")) return false;
      if ((r.heure ?? "").includes("#")) return false;
      return true;
    })
    .map((r) => {
      // Convert decimal hour to HH:MM:SS
      if (r.heure) r.heure = convertDecimalHour(r.heure);
      // Convert serial date to YYYY-MM-DD if needed
      if (r.date && /^\d{4,6}$/.test(r.date.trim())) {
        r.date = convertSerialDate(r.date.trim());
      }
      return r;
    });
}
