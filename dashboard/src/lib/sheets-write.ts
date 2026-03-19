import { getSheets } from "./google-auth";

const SHEET_01 = process.env.SHEET_01_ID!;
const SHEET_02 = process.env.SHEET_02_ID!;
const SHEET_03 = process.env.SHEET_03_ID!;

async function getHeaders(sheetId: string, tabName: string): Promise<string[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!1:1`,
  });
  return (res.data.values?.[0] as string[]) ?? [];
}

async function getAllRows(sheetId: string, tabName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: tabName,
  });
  return (res.data.values as string[][]) ?? [];
}

/** Find the row where matchColumn=matchValue, then update updateColumn with updateValue */
export async function updateCell(
  sheetId: string,
  tabName: string,
  matchColumn: string,
  matchValue: string,
  updateColumn: string,
  updateValue: string
) {
  const rows = await getAllRows(sheetId, tabName);
  if (rows.length < 2) throw new Error(`Tab ${tabName} has no data rows`);

  const headers = rows[0];
  const matchIdx = headers.indexOf(matchColumn);
  const updateIdx = headers.indexOf(updateColumn);

  if (matchIdx === -1) throw new Error(`Column "${matchColumn}" not found in ${tabName}`);
  if (updateIdx === -1) throw new Error(`Column "${updateColumn}" not found in ${tabName}`);

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][matchIdx] ?? "") === matchValue) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`No row found where ${matchColumn}="${matchValue}" in ${tabName}`);
  }

  // Sheets is 1-indexed, row 0 = header = row 1 in Sheets
  const cellRef = `${tabName}!${columnLetter(updateIdx)}${rowIndex + 1}`;

  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: cellRef,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[updateValue]] },
  });
}

/** Append a row to a tab */
export async function appendRow(
  sheetId: string,
  tabName: string,
  values: Record<string, string>
) {
  const headers = await getHeaders(sheetId, tabName);
  const row = headers.map((h) => values[h] ?? "");

  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

/** Shortcut to update a workflow flag on a session */
export async function updateSessionWorkflow(
  sessionId: string,
  workflowField: string,
  value: string = "TRUE"
) {
  await updateCell(SHEET_01, "Sessions", "session_id", sessionId, workflowField, value);
}

/** Log an entry to Journal_Systeme in Sheet 03 */
export async function logJournal(
  workflow: string,
  sessionId: string,
  statut: string,
  message: string
) {
  const now = new Date();
  const date = now.toISOString().substring(0, 10);
  const heure = now.toTimeString().substring(0, 8);

  await appendRow(SHEET_03, "Journal_Systeme", {
    date,
    heure,
    workflow,
    session_id: sessionId,
    statut,
    message,
  });
}

function columnLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}
