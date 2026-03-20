import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { nom, email, organisme, message } = await req.json();
    if (!nom || !email || !message) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    await sendEmail(
      "contact@formation-alsace.fr",
      `[Contact] ${nom} — ${organisme || "N/A"}`,
      `<p><strong>De :</strong> ${nom} (${email})</p>
      <p><strong>Organisme :</strong> ${organisme || "Non renseigné"}</p>
      <hr/>
      <p>${message.replace(/\n/g, "<br/>")}</p>`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
