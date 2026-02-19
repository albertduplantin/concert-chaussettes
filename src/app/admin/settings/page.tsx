import { db } from "@/lib/db";
import { users, groupes, concerts, reports, avis } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Info,
  Mail,
  Database,
  Globe,
  Flag,
  CheckCircle,
  XCircle,
  Server,
} from "lucide-react";

export default async function AdminSettingsPage() {
  const [
    totalUsers,
    totalGroupes,
    totalConcerts,
    pendingReports,
    totalAvis,
    visibleGroupes,
    publishedConcerts,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(groupes),
    db.select({ count: count() }).from(concerts),
    db.select({ count: count() }).from(reports).where(eq(reports.status, "PENDING")),
    db.select({ count: count() }).from(avis),
    db.select({ count: count() }).from(groupes).where(eq(groupes.isVisible, true)),
    db.select({ count: count() }).from(concerts).where(eq(concerts.status, "PUBLIE")),
  ]);

  const envVars = [
    { name: "DATABASE_URL", label: "Base de données (Neon)", isSet: !!process.env.DATABASE_URL },
    { name: "BREVO_API_KEY", label: "Emails (Brevo)", isSet: !!process.env.BREVO_API_KEY },
    { name: "AUTH_SECRET", label: "Auth secret", isSet: !!process.env.AUTH_SECRET },
    { name: "UPLOADTHING_TOKEN", label: "Fichiers (UploadThing)", isSet: !!process.env.UPLOADTHING_TOKEN },
    { name: "AUTH_GOOGLE_ID", label: "Google OAuth", isSet: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) },
    { name: "NEXT_PUBLIC_APP_URL", label: "URL de l'app", isSet: !!process.env.NEXT_PUBLIC_APP_URL, value: process.env.NEXT_PUBLIC_APP_URL },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration et état de la plateforme
        </p>
      </div>

      {/* Platform info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            À propos de la plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Environnement</p>
              <p className="text-lg font-semibold capitalize">{process.env.NODE_ENV}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Framework</p>
              <p className="text-lg font-semibold">Next.js 15</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            État de la base de données
          </CardTitle>
          <CardDescription>Volumes de données actuels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatItem label="Utilisateurs" value={totalUsers[0]?.count ?? 0} />
            <StatItem label="Groupes" value={totalGroupes[0]?.count ?? 0} subtitle={`${visibleGroupes[0]?.count ?? 0} visibles`} />
            <StatItem label="Concerts" value={totalConcerts[0]?.count ?? 0} subtitle={`${publishedConcerts[0]?.count ?? 0} publiés`} />
            <StatItem label="Avis" value={totalAvis[0]?.count ?? 0} />
          </div>
          {(pendingReports[0]?.count ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <Flag className="h-4 w-4 text-orange-500" />
              <p className="text-sm">
                <span className="font-semibold text-orange-600">{pendingReports[0]?.count}</span>{" "}
                signalement{(pendingReports[0]?.count ?? 0) > 1 ? "s" : ""} en attente de traitement
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Variables d&apos;environnement
          </CardTitle>
          <CardDescription>
            État des services externes configurés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envVars.map((env) => (
              <div key={env.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  {env.isSet ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{env.label}</p>
                    {env.value && (
                      <p className="text-xs text-muted-foreground font-mono">{env.value}</p>
                    )}
                  </div>
                </div>
                <Badge variant={env.isSet ? "outline" : "destructive"} className="text-xs">
                  {env.isSet ? "Configuré" : "Manquant"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expéditeur</p>
              <p className="font-medium">{process.env.EMAIL_FROM_NAME || "Concert Chaussettes"}</p>
              <p className="text-sm text-muted-foreground">{process.env.EMAIL_FROM || "Non configuré"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fournisseur</p>
              <p className="font-medium">Brevo (SendinBlue)</p>
              <p className="text-sm text-muted-foreground">
                {process.env.BREVO_API_KEY ? "Clé API configurée" : "Clé API manquante"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            URLs de la plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">URL principale</p>
              <a
                href={process.env.NEXT_PUBLIC_APP_URL || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-orange-600 hover:underline font-mono"
              >
                {process.env.NEXT_PUBLIC_APP_URL || "Non définie"}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Sitemap</p>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-orange-600 hover:underline font-mono"
              >
                /sitemap.xml
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Robots</p>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/robots.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-orange-600 hover:underline font-mono"
              >
                /robots.txt
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Google OAuth callback</p>
              <p className="text-sm font-mono text-muted-foreground">
                {process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
