"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InscriptionManagementProps {
  inscriptionId: string;
  token: string;
  initialData: {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    nombrePersonnes: number;
    status: string;
    showInGuestList: boolean;
  };
  isPast: boolean;
  isCancelled: boolean;
  maxInvites: number | null;
}

export function InscriptionManagement({
  inscriptionId,
  token,
  initialData,
  isPast,
  isCancelled,
  maxInvites,
}: InscriptionManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [data, setData] = useState(initialData);

  const [formData, setFormData] = useState({
    prenom: data.prenom,
    nom: data.nom,
    telephone: data.telephone,
    nombrePersonnes: data.nombrePersonnes,
    showInGuestList: data.showInGuestList,
  });

  const statusConfig = {
    CONFIRME: {
      label: "Confirme",
      icon: CheckCircle,
      className: "bg-green-500/10 text-green-400 border-green-500/30",
    },
    LISTE_ATTENTE: {
      label: "Liste d'attente",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    },
    ANNULE: {
      label: "Annule",
      icon: XCircle,
      className: "bg-red-500/10 text-red-400 border-red-500/30",
    },
  };

  const status = statusConfig[data.status as keyof typeof statusConfig] || statusConfig.CONFIRME;
  const StatusIcon = status.icon;

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inscriptions/${inscriptionId}?token=${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Erreur lors de la modification");
        return;
      }

      setData({
        ...data,
        prenom: result.inscription.prenom || "",
        nom: result.inscription.nom,
        telephone: result.inscription.telephone || "",
        nombrePersonnes: result.inscription.nombrePersonnes,
        showInGuestList: result.inscription.showInGuestList,
      });

      setIsEditing(false);
      toast.success("Inscription modifiee avec succes");
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inscriptions/${inscriptionId}?token=${token}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Erreur lors de l'annulation");
        return;
      }

      setData({ ...data, status: "ANNULE" });
      setShowCancelConfirm(false);
      toast.success("Inscription annulee");
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsLoading(false);
    }
  }

  // Cancelled or past event - read only
  if (isCancelled || isPast) {
    return (
      <div className="space-y-6">
        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border",
          isCancelled ? "bg-red-500/10 border-red-500/30" : "bg-gray-500/10 border-gray-500/30"
        )}>
          {isCancelled ? (
            <>
              <XCircle className="h-6 w-6 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Inscription annulee</p>
                <p className="text-sm text-white/60">Cette inscription a ete annulee.</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-6 w-6 text-gray-400" />
              <div>
                <p className="font-medium text-gray-400">Concert termine</p>
                <p className="text-sm text-white/60">Ce concert a deja eu lieu.</p>
              </div>
            </>
          )}
        </div>

        {/* Read-only info */}
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/60">Prenom</p>
              <p className="font-medium">{data.prenom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Nom</p>
              <p className="font-medium">{data.nom}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Email</p>
              <p className="font-medium">{data.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Nombre de personnes</p>
              <p className="font-medium">{data.nombrePersonnes}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        status.className
      )}>
        <div className="flex items-center gap-3">
          <StatusIcon className="h-6 w-6" />
          <div>
            <p className="font-medium">{status.label}</p>
            <p className="text-sm opacity-80">
              {data.status === "CONFIRME" && "Votre place est reservee"}
              {data.status === "LISTE_ATTENTE" && "Vous serez prevenu si une place se libere"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-current">
          <Users className="h-3 w-3 mr-1" />
          {data.nombrePersonnes} place{data.nombrePersonnes > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Edit form or read view */}
      {isEditing ? (
        <div className="bg-white/5 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prenom</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="bg-white/10 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="bg-white/10 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="Optionnel"
                className="bg-white/10 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombrePersonnes">Nombre de personnes</Label>
              <Input
                id="nombrePersonnes"
                type="number"
                min={1}
                max={10}
                value={formData.nombrePersonnes}
                onChange={(e) => setFormData({ ...formData, nombrePersonnes: parseInt(e.target.value) || 1 })}
                className="bg-white/10 border-white/20"
              />
            </div>
          </div>

          {/* Privacy option */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.showInGuestList ? (
                <Eye className="h-5 w-5 text-white/60" />
              ) : (
                <EyeOff className="h-5 w-5 text-white/60" />
              )}
              <div>
                <p className="font-medium">Apparaitre dans la liste des invites</p>
                <p className="text-sm text-white/60">
                  Votre prenom sera visible par les autres invites
                </p>
              </div>
            </div>
            <Switch
              checked={formData.showInGuestList}
              onCheckedChange={(checked) => setFormData({ ...formData, showInGuestList: checked })}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  prenom: data.prenom,
                  nom: data.nom,
                  telephone: data.telephone,
                  nombrePersonnes: data.nombrePersonnes,
                  showInGuestList: data.showInGuestList,
                });
                setIsEditing(false);
              }}
              className="border-white/20 hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/60">Prenom</p>
              <p className="font-medium">{data.prenom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Nom</p>
              <p className="font-medium">{data.nom}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Email</p>
              <p className="font-medium">{data.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Telephone</p>
              <p className="font-medium">{data.telephone || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60 pt-2">
            {data.showInGuestList ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Visible dans la liste des invites</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Non visible dans la liste des invites</span>
              </>
            )}
          </div>

          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="w-full mt-4 border-white/20 hover:bg-white/10"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier mon inscription
          </Button>
        </div>
      )}

      {/* Cancel section */}
      {!showCancelConfirm ? (
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full text-center py-3 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Annuler mon inscription
        </button>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-400">Confirmer l'annulation</p>
              <p className="text-sm text-white/70 mt-1">
                Cette action est irreversible. Votre place sera liberee et pourra etre attribuee
                a une autre personne.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmer l'annulation
            </Button>
            <Button
              onClick={() => setShowCancelConfirm(false)}
              variant="outline"
              className="border-white/20 hover:bg-white/10"
            >
              Retour
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
