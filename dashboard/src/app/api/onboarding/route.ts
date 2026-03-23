import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type StepName = "org" | "formation" | "formateur";

async function getAuthenticatedUser(req: NextRequest) {
  // Try Authorization header first (client sends Bearer token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const admin = createAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return null;
    return user;
  }

  // Fallback to cookie-based auth
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in read-only context
          }
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  let body: { step?: string; data?: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { step, data } = body;

  if (!step || !["org", "formation", "formateur"].includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = createAdminClient();

  // Get user's org_id from profile
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const orgId = profile.org_id as string;
  const stepName = step as StepName;

  try {
    if (stepName === "org") {
      // Update organization details
      const { error: updateErr } = await admin
        .from("organizations")
        .update({
          siret: (data.siret as string) || null,
          adresse: (data.adresse as string) || null,
          telephone: (data.telephone as string) || null,
          nda: (data.nda as string) || null,
          email_contact: (data.email_contact as string) || null,
        })
        .eq("id", orgId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else if (stepName === "formation") {
      // Create first formation
      const { error: insertErr } = await admin.from("formations").insert({
        org_id: orgId,
        intitule: (data.intitule as string) || "Nouvelle formation",
        duree_heures: (data.duree_heures as number) || 0,
        objectifs: (data.objectifs as string) || null,
        prerequis: (data.prerequis as string) || null,
        modalite: (data.modalite as string) || "presentiel",
        tarif_ht: (data.tarif_ht as number) || 0,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    } else if (stepName === "formateur") {
      // Create first formateur
      const { error: insertErr } = await admin.from("formateurs").insert({
        org_id: orgId,
        nom: (data.nom as string) || "",
        prenom: (data.prenom as string) || "",
        email: (data.email as string) || "",
        specialite: (data.specialite as string) || null,
        qualifications: (data.qualifications as string) || null,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      // Mark onboarding as complete
      await admin
        .from("organizations")
        .update({ onboarding_completed: true })
        .eq("id", orgId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
