import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts, organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true, nom: true },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const rows = await db
    .select({
      nom: contacts.nom,
      email: contacts.email,
      telephone: contacts.telephone,
      tags: contacts.tags,
      nombreParticipations: contacts.nombreParticipations,
    })
    .from(contacts)
    .where(eq(contacts.organisateurId, organisateur.id))
    .orderBy(contacts.nom);

  const escape = (v: string | null | undefined) => {
    if (!v) return "";
    return `"${v.replace(/"/g, '""')}"`;
  };

  const header = "nom,email,telephone,tags,nombre_participations";
  const lines = rows.map((r) =>
    [
      escape(r.nom),
      escape(r.email),
      escape(r.telephone),
      escape((r.tags ?? []).join("|")),
      r.nombreParticipations,
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  const date = format(new Date(), "yyyy-MM-dd");
  const slug = organisateur.nom.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${slug}-${date}.csv"`,
    },
  });
}
