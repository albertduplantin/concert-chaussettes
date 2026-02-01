import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Info } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de la plateforme
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            À propos
          </CardTitle>
          <CardDescription>
            Informations sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Environnement</p>
              <p className="text-lg">{process.env.NODE_ENV}</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Concert Chaussettes - Plateforme de mise en relation pour concerts privés.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Les paramètres avancés seront disponibles prochainement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Cette section permettra de configurer les emails, les notifications,
            les limites de la plateforme et autres paramètres globaux.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
