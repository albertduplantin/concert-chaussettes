"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Inscription {
  id: string;
  prenom: string | null;
  nom: string;
  email: string;
  telephone: string | null;
  nombrePersonnes: number;
  status: string;
}

interface InscriptionActionsProps {
  concertId: string;
  inscription: Inscription;
}

export function InscriptionActions({ concertId, inscription }: InscriptionActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    prenom: inscription.prenom || "",
    nom: inscription.nom,
    telephone: inscription.telephone || "",
    nombrePersonnes: inscription.nombrePersonnes,
    status: inscription.status,
  });

  async function handleUpdate() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/organisateur/concerts/${concertId}/inscriptions/${inscription.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message || "Erreur lors de la modification");
        return;
      }

      toast.success("Inscription modifiee");
      setIsEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/organisateur/concerts/${concertId}/inscriptions/${inscription.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message || "Erreur lors de la suppression");
        return;
      }

      toast.success("Inscription supprimee");
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/organisateur/concerts/${concertId}/inscriptions/${inscription.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message || "Erreur lors du changement de statut");
        return;
      }

      toast.success("Statut modifie");
      router.refresh();
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {inscription.status !== "CONFIRME" && (
            <DropdownMenuItem onClick={() => handleStatusChange("CONFIRME")}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Confirmer
            </DropdownMenuItem>
          )}
          {inscription.status !== "LISTE_ATTENTE" && (
            <DropdownMenuItem onClick={() => handleStatusChange("LISTE_ATTENTE")}>
              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
              Mettre en attente
            </DropdownMenuItem>
          )}
          {inscription.status !== "ANNULE" && (
            <DropdownMenuItem onClick={() => handleStatusChange("ANNULE")}>
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Annuler
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;inscription</DialogTitle>
            <DialogDescription>
              Modifier les informations de {inscription.prenom} {inscription.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prenom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePersonnes">Nombre de personnes</Label>
                <Input
                  id="nombrePersonnes"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.nombrePersonnes}
                  onChange={(e) => setFormData({ ...formData, nombrePersonnes: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRME">Confirme</SelectItem>
                    <SelectItem value="LISTE_ATTENTE">Liste d&apos;attente</SelectItem>
                    <SelectItem value="ANNULE">Annule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;inscription</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer l&apos;inscription de{" "}
              <strong>{inscription.prenom} {inscription.nom}</strong> ?
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add inscription button component
interface AddInscriptionButtonProps {
  concertId: string;
}

export function AddInscriptionButton({ concertId }: AddInscriptionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    nombrePersonnes: 1,
    status: "CONFIRME",
  });

  async function handleSubmit() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organisateur/concerts/${concertId}/inscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erreur lors de l'ajout");
        return;
      }

      toast.success("Inscription ajoutee");
      setIsOpen(false);
      setFormData({
        prenom: "",
        nom: "",
        email: "",
        telephone: "",
        nombrePersonnes: 1,
        status: "CONFIRME",
      });
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un invite</DialogTitle>
          <DialogDescription>
            Ajouter manuellement une inscription a ce concert.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-prenom">Prenom *</Label>
              <Input
                id="add-prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nom">Nom *</Label>
              <Input
                id="add-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">Email *</Label>
            <Input
              id="add-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-telephone">Telephone</Label>
            <Input
              id="add-telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-nombrePersonnes">Nombre de personnes</Label>
              <Input
                id="add-nombrePersonnes"
                type="number"
                min={1}
                max={10}
                value={formData.nombrePersonnes}
                onChange={(e) => setFormData({ ...formData, nombrePersonnes: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRME">Confirme</SelectItem>
                  <SelectItem value="LISTE_ATTENTE">Liste d&apos;attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.prenom || !formData.nom || !formData.email}
          >
            {isLoading ? "Ajout en cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
