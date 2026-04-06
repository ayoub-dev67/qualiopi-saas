import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// GET — returns formations and formateurs for populating dropdowns
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [{ data: formations }, { data: formateurs }] = await Promise.all([
    supabase.from("formations").select("id, ref, intitule").eq("is_deleted", false).order("intitule"),
    supabase.from("formateurs").select("id, ref, nom, prenom").eq("is_deleted", false).order("nom"),
  ]);

  return NextResponse.json({
    formations: formations ?? [],
    formateurs: formateurs ?? [],
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const orgId = profile.org_id as string;

  // Validate required fields
  const formation_id = body.formation_id as string | undefined;
  const formateur_id = body.formateur_id as string | undefined;
  const date_debut = body.date_debut as string | undefined;
  const date_fin = body.date_fin as string | undefined;

  if (!formation_id || !formateur_id || !date_debut || !date_fin) {
    return NextResponse.json(
      { error: "Champs requis : formation, intervenant, date début, date fin" },
      { status: 400 }
    );
  }

  // Generate ref via RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: refData, error: refErr } = await (supabase as any).rpc("generate_ref", {
    prefix: "SES",
    org: orgId,
    tbl: "sessions",
  });

  if (refErr) {
    return NextResponse.json({ error: refErr.message }, { status: 500 });
  }

  const ref = refData as string;

  // Insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("sessions")
    .insert({
      org_id: orgId,
      ref,
      formation_id,
      formateur_id,
      date_debut,
      date_fin,
      lieu: (body.lieu as string) || null,
      modalite: (body.modalite as string) || "presentiel",
      nombre_places: (body.nombre_places as number) || 10,
      statut: (body.statut as string) || "planifiee",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, session: data });
}
