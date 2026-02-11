import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactShareTokens, organisateurs } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";

const createShareSchema = z.object({
  expiresInDays: z.number().min(1).max(30).default(7),
  maxUses: z.number().min(1).max(100).default(10),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const tokens = await db
    .select()
    .from(contactShareTokens)
    .where(
      and(
        eq(contactShareTokens.organisateurId, organisateur.id),
        eq(contactShareTokens.isRevoked, false),
        gt(contactShareTokens.expiresAt, new Date())
      )
    )
    .orderBy(contactShareTokens.createdAt);

  return NextResponse.json(tokens);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { expiresInDays, maxUses } = parsed.data;
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const [created] = await db.insert(contactShareTokens).values({
    organisateurId: organisateur.id,
    token,
    label: organisateur.nom,
    expiresAt,
    maxUses,
  }).returning();

  const baseUrl = process.env.NEXTAUTH_URL || "https://concert-chaussettes.vercel.app";
  const url = `${baseUrl}/import-contacts/${token}`;

  return NextResponse.json({ id: created.id, token, url, expiresAt });
}
