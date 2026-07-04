interface RevealableAvis {
  concertId: string | null;
  cible: "GROUPE" | "ORGANISATEUR";
  auteurType: string;
  revealAt: Date | null;
}

/**
 * Règle de révélation différée façon Airbnb pour les avis "professionnels"
 * (l'organisateur note le groupe, le groupe note l'organisateur) : un avis reste
 * masqué tant que la contrepartie n'a pas répondu pour le même concert, ou tant
 * que la date de révélation n'est pas dépassée — pour empêcher les représailles.
 * Les avis d'invités (INVITE) sont toujours visibles immédiatement.
 */
export function filterRevealedAvis<T extends RevealableAvis>(rows: T[]): T[] {
  const now = new Date();

  const concertsRatedAsGroupe = new Set(
    rows
      .filter((r) => r.cible === "GROUPE" && r.auteurType === "ORGANISATEUR" && r.concertId)
      .map((r) => r.concertId)
  );
  const concertsRatedAsOrganisateur = new Set(
    rows.filter((r) => r.cible === "ORGANISATEUR" && r.concertId).map((r) => r.concertId)
  );

  return rows.filter((r) => {
    if (r.auteurType === "INVITE") return true;
    if (!r.concertId) return true;
    if (concertsRatedAsGroupe.has(r.concertId) && concertsRatedAsOrganisateur.has(r.concertId)) {
      return true;
    }
    return !!(r.revealAt && now > new Date(r.revealAt));
  });
}
