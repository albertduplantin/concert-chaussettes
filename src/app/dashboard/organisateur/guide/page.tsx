import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  CalendarPlus,
  Users,
  Star,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

const STEPS = [
  {
    num: 1,
    icon: Search,
    title: "Trouver un groupe",
    description:
      "Utilisez la page « Trouver un groupe » pour parcourir le catalogue. Filtrez par ville, département, genre musical ou note. Passez en mode Carte pour visualiser les groupes près de chez vous.",
    cta: { label: "Parcourir les groupes", href: "/dashboard/organisateur/search" },
    tips: ["Activez « Près de moi » pour voir les groupes dans un rayon précis", "Cliquez sur un groupe pour voir ses vidéos YouTube"],
  },
  {
    num: 2,
    icon: Mail,
    title: "Contacter le groupe",
    description:
      "Sur la fiche du groupe, cliquez sur « Organiser un concert avec ce groupe » pour pré-remplir un nouveau concert, ou utilisez directement l'email, le téléphone ou le site web affiché.",
    cta: null,
    tips: ["Précisez la date souhaitée, le lieu et le budget dans votre premier message"],
  },
  {
    num: 3,
    icon: CalendarPlus,
    title: "Créer le concert",
    description:
      "Dans « Mes concerts », cliquez sur « Nouveau concert ». Renseignez le titre, la date, le lieu et associez le groupe. Le concert apparaît en statut « À venir ».",
    cta: { label: "Créer un concert", href: "/dashboard/organisateur/concerts/new" },
    tips: ["Vous pouvez modifier le concert à tout moment avant la date"],
  },
  {
    num: 4,
    icon: Users,
    title: "Inviter des personnes",
    description:
      "Depuis la page du concert, utilisez le composeur d'invitation pour envoyer les liens d'inscription à vos contacts. Chaque invité reçoit un lien personnalisé.",
    cta: null,
    tips: [
      "Importez vos contacts depuis Google Contacts (CSV ou VCF)",
      "Partagez aussi le lien d'inscription directement par SMS ou WhatsApp",
    ],
  },
  {
    num: 5,
    icon: Star,
    title: "Après le concert : évaluer le groupe",
    description:
      "Une fois le concert passé, retournez sur sa page pour évaluer le groupe (1 à 5 étoiles). Vous pouvez aussi partager un QR code ou un lien pour que les invités laissent leur propre avis.",
    cta: null,
    tips: ["Les avis sont visibles sur la fiche publique du groupe", "Un seul avis par personne et par concert"],
  },
];

export default async function GuidePage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") redirect("/");

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Guide de démarrage</h1>
            <p className="text-white/90 max-w-xl">
              Tout ce qu'il faut savoir pour organiser votre premier concert privé avec Concert Chaussettes.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={step.num} className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-0">
                  {/* Step number bar */}
                  <div className="w-1 bg-gradient-to-b from-orange-400 to-amber-400 flex-shrink-0" />
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0 font-bold">
                            Étape {step.num}
                          </Badge>
                          <h2 className="font-semibold text-lg">{step.title}</h2>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                          {step.description}
                        </p>
                        {/* Tips */}
                        <ul className="space-y-1 mb-4">
                          {step.tips.map((tip, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                        {/* CTA */}
                        {step.cta && (
                          <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 gap-2">
                            <Link href={step.cta.href}>
                              {step.cta.label}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer CTA */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Prêt à organiser votre premier concert ?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Commencez par trouver un groupe qui correspond à vos envies.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-orange-500 hover:bg-orange-600 gap-2">
              <Link href="/dashboard/organisateur/search">
                <Search className="h-4 w-4" />
                Trouver un groupe
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/organisateur/concerts/new">
                <CalendarPlus className="h-4 w-4" />
                Créer un concert
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
