import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { QuestionnaireType } from "@/types/database";

const VALID_TYPES: QuestionnaireType[] = ["positionnement", "emargement", "satisfaction", "evaluation", "suivi_froid"];

const TABLE_MAP: Record<QuestionnaireType, string> = {
  positionnement: "positionnements",
  emargement: "emargements",
  satisfaction: "satisfaction",
  evaluation: "evaluations",
  suivi_froid: "suivi_froid",
};

export async function POST(req: NextRequest) {
  let body: { token?: string; type?: string; data?: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, type, data } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type as QuestionnaireType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate token and check it matches the type
  const { data: q, error: qErr } = await admin
    .from("questionnaires_envoyes")
    .select("*")
    .eq("token", token)
    .eq("type", type)
    .single();

  if (qErr || !q) {
    return NextResponse.json({ error: "Invalid or mismatched token" }, { status: 404 });
  }

  if (q.statut === "complete") {
    return NextResponse.json({ error: "Already completed" }, { status: 410 });
  }

  // Build the row to insert
  const table = TABLE_MAP[type as QuestionnaireType];
  const now = new Date().toISOString();

  const row: Record<string, unknown> = {
    org_id: q.org_id,
    session_id: q.session_id,
    ...data,
  };

  // Add inscription_id if present on the questionnaire
  if (q.inscription_id) {
    row.inscription_id = q.inscription_id;
  }

  // Add the completion timestamp field
  if (type === "emargement") {
    row.signed_at = now;
  } else {
    row.completed_at = now;
  }

  // Insert into the appropriate table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await admin.from(table as any).insert(row as any);

  if (insertErr) {
    return NextResponse.json(
      { error: `Insert failed: ${insertErr.message}` },
      { status: 500 }
    );
  }

  // Update questionnaire status to complete
  await admin
    .from("questionnaires_envoyes")
    .update({ statut: "complete", completed_at: now })
    .eq("id", q.id);

  return NextResponse.json({ success: true });
}
