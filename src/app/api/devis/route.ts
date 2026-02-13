import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { demandesDevis, groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError, handleApiError } from "@/lib/api-error";
import { notifyDevisReceived } from "@/lib/email";
import { z } from "zod";

const devisSchema = z.object({
  groupeId: z.string().uuid(),
  nom: z.string().min(1).max(255),
  email: z.string().email().max(255),
  telephone: z.string().max(20).optional(),
  dateSouhaitee: z.string().refine((d) => !isNaN(Date.parse(d)), "Date invalide"),
  nombreInvites: z.string().max(20).optional(),
  lieu: z.string().min(1).max(255),
  typeEvenement: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = devisSchema.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Données invalides", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { groupeId, nom, email, telephone, dateSouhaitee, nombreInvites, lieu, typeEvenement, message } = parsed.data;

    // Verify group exists
    const groupe = await db.query.groupes.findFirst({
      where: eq(groupes.id, groupeId),
      columns: { id: true, contactEmail: true, nom: true },
    });

    if (!groupe) {
      throw ApiError.notFound("Groupe non trouvé");
    }

    const [demande] = await db
      .insert(demandesDevis)
      .values({
        groupeId,
        nom,
        email,
        telephone: telephone || null,
        dateSouhaitee: new Date(dateSouhaitee),
        nombreInvites: nombreInvites || null,
        lieu,
        typeEvenement: typeEvenement || null,
        message: message || null,
      })
      .returning({ id: demandesDevis.id });

    // Email notification (fire-and-forget)
    if (groupe.contactEmail) {
      notifyDevisReceived({
        groupeContactEmail: groupe.contactEmail,
        groupeNom: groupe.nom,
        requesterNom: nom,
        requesterEmail: email,
        requesterTelephone: telephone || null,
        dateSouhaitee,
        nombreInvites: nombreInvites || null,
        lieu,
        typeEvenement: typeEvenement || null,
        message: message || null,
      }).catch(() => {});
    }

    return NextResponse.json({ id: demande.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/devis");
  }
}
