import { NextRequest, NextResponse } from "next/server";
import { getSheets } from "@/lib/google-auth";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const sheetId = process.env.SHEET_02_ID!;
  const sheets = getSheets();

  try {
    // 1. Add the new tab
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: "Questionnaires_Envoyes",
              },
            },
          },
        ],
      },
    });

    // 2. Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Questionnaires_Envoyes!A1:G1",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          ["inscription_id", "session_id", "type", "statut", "date_envoi", "nb_relances", "date_derniere_relance"],
        ],
      },
    });

    return NextResponse.json({ success: true, message: "Tab Questionnaires_Envoyes created with headers" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
