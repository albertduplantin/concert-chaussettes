import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { db } from "@/lib/db";
import { avis } from "@/lib/db/schema";
import { eq, desc, isNotNull, and } from "drizzle-orm";

function Testimonial({
  quote,
  author,
  role,
  rating,
}: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6 pb-6 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Quote className="h-8 w-8 text-primary/20 mb-2" />
        <p className="text-muted-foreground flex-1 italic">{quote}</p>
        <div className="mt-4 pt-4 border-t">
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export async function Testimonials() {
  const realAvis = await db.query.avis.findMany({
    where: and(
      eq(avis.isVisible, true),
      isNotNull(avis.commentaire),
    ),
    orderBy: [desc(avis.note), desc(avis.createdAt)],
    limit: 3,
    with: {
      groupe: { columns: { nom: true } },
    },
  });

  if (realAvis.length === 0) return null;

  const typeLabels: Record<string, string> = {
    ORGANISATEUR: "Organisateur",
    INVITE: "Invité",
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ce qu&apos;ils en pensent
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Les derniers avis laissés par la communauté
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {realAvis.map((a) => (
            <Testimonial
              key={a.id}
              quote={a.commentaire!}
              author={a.auteurNom || "Anonyme"}
              role={
                a.groupe
                  ? `${typeLabels[a.auteurType] || "Avis"} — ${a.groupe.nom}`
                  : typeLabels[a.auteurType] || "Avis"
              }
              rating={a.note}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
