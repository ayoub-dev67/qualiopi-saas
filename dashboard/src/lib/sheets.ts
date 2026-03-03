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

// Sheet 01 - Référentiel
export const getOrganisme  = () => fetchSheet(SHEET_01, "Organisme");
export const getFormations = () => fetchSheet(SHEET_01, "Formations");
export const getFormateurs = () => fetchSheet(SHEET_01, "Formateurs");
export const getSessions   = () => fetchSheet(SHEET_01, "Sessions");
export const getConfig     = () => fetchSheet(SHEET_01, "Config");
export const getFinancier  = () => fetchSheet(SHEET_01, "Financier");

// Sheet 02 - Suivi Apprenants
export const getInscriptions = () => fetchSheet(SHEET_02, "Inscriptions");
export const getApprenants   = () => fetchSheet(SHEET_02, "Apprenants");

// Sheet 03 - Qualité & KPIs
export const getSatisfaction = () => fetchSheet(SHEET_03, "Satisfaction");
export const getReclamations = () => fetchSheet(SHEET_03, "Réclamations");
export const getKPIs         = () => fetchSheet(SHEET_03, "KPIs");
export const getJournal      = () => fetchSheet(SHEET_03, "Journal_Systeme");
export const getSuiviFroid   = () => fetchSheet(SHEET_03, "Suivi_Froid");
