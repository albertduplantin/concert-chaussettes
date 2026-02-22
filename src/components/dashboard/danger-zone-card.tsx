"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";

interface DangerZoneCardProps {
  groupeId: string;
  isVisible: boolean;
}

export function DangerZoneCard({ groupeId, isVisible: initialVisible }: DangerZoneCardProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleToggleVisibility() {
    setLoadingVisibility(true);
    try {
      const res = await fetch(`/api/groupes/${groupeId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (res.ok) {
        setIsVisible(!isVisible);
        router.refresh();
      }
    } finally {
      setLoadingVisibility(false);
    }
  }

  async function handleDelete() {
    setLoadingDelete(true);
    try {
      const res = await fetch(`/api/groupes/${groupeId}`, { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      }
    } finally {
      setLoadingDelete(false);
    }
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Zone de danger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dépublier / republier */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">
                {isVisible ? "Dépublier le profil" : "Republier le profil"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isVisible
                  ? "Votre profil sera masqué des recherches mais vos données seront conservées."
                  : "Votre profil redeviendra visible dans les recherches."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleVisibility}
              disabled={loadingVisibility}
              className="shrink-0"
            >
              {isVisible ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Dépublier
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Republier
                </>
              )}
            </Button>
          </div>

          {/* Supprimer le compte */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div>
              <p className="font-medium text-sm text-red-700 dark:text-red-400">
                Supprimer le compte
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">
                Action irréversible. Toutes vos données seront définitivement supprimées.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue de confirmation suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer votre compte ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Votre profil, vos photos, vos concerts et toutes vos données seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? "Suppression…" : "Oui, supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
