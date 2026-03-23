import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = createAdminClient();
  const { data: q } = await admin
    .from("questionnaires_envoyes")
    .select("*, sessions(*, formations(*), formateurs(*)), inscriptions(*, apprenants(*))")
    .eq("token", token)
    .single();

  if (!q) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (q.statut === "complete") return NextResponse.json({ error: "Already completed" }, { status: 410 });

  // Get org info
  const { data: org } = await admin
    .from("organizations")
    .select("nom, logo_url")
    .eq("id", q.org_id)
    .single();

  return NextResponse.json({ questionnaire: q, organization: org });
}
