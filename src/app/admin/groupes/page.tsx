"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface Groupe {
  id: string;
  nom: string;
  ville: string | null;
  departement: string | null;
  isVerified: boolean;
  isBoosted: boolean;
  isVisible: boolean;
  createdAt: string;
  user: {
    email: string;
  } | null;
}

export default function AdminGroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroupe, setEditingGroupe] = useState<Groupe | null>(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    ville: "",
    isVerified: false,
    isBoosted: false,
    isVisible: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroupe, setDeletingGroupe] = useState<Groupe | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGroupes();
  }, []);

  async function fetchGroupes() {
    try {
      const res = await fetch("/api/admin/groupes");
      if (res.ok) {
        const data = await res.json();
        setGroupes(data.groupes || []);
      }
    } catch (error) {
      console.error("Error fetching groupes:", error);
      toast.error("Erreur lors du chargement des groupes");
    } finally {
      setLoading(false);
    }
  }

  const filteredGroupes = groupes.filter((groupe) => {
    const matchesSearch =
      groupe.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupe.ville?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "verified") matchesStatus = groupe.isVerified;
    else if (statusFilter === "unverified") matchesStatus = !groupe.isVerified;
    else if (statusFilter === "boosted") matchesStatus = groupe.isBoosted;
    else if (statusFilter === "hidden") matchesStatus = !groupe.isVisible;

    return matchesSearch && matchesStatus;
  });

  function openEditDialog(groupe: Groupe) {
    setEditingGroupe(groupe);
    setEditForm({
      nom: groupe.nom,
      ville: groupe.ville || "",
      isVerified: groupe.isVerified,
      isBoosted: groupe.isBoosted,
      isVisible: groupe.isVisible,
    });
    setEditDialogOpen(true);
  }

  async function handleEdit() {
    if (!editingGroupe) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/groupes/${editingGroupe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success("Groupe modifié");
        setEditDialogOpen(false);
        fetchGroupes();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || data.error || "Erreur lors de la modification");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(groupe: Groupe) {
    setDeletingGroupe(groupe);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingGroupe) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/groupes/${deletingGroupe.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Groupe supprimé");
        setDeleteDialogOpen(false);
        fetchGroupes();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  async function quickToggle(groupe: Groupe, field: "isVerified" | "isBoosted" | "isVisible") {
    try {
      const res = await fetch(`/api/admin/groupes/${groupe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !groupe[field] }),
      });

      if (res.ok) {
        toast.success("Groupe mis à jour");
        fetchGroupes();
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des groupes</h1>
          <p className="text-muted-foreground mt-1">
            {groupes.length} groupe{groupes.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="verified">Vérifiés</SelectItem>
            <SelectItem value="unverified">Non vérifiés</SelectItem>
            <SelectItem value="boosted">Mis en avant</SelectItem>
            <SelectItem value="hidden">Masqués</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Statuts</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredGroupes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Aucun groupe trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredGroupes.map((groupe) => (
                <TableRow key={groupe.id} className={!groupe.isVisible ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{groupe.nom}</TableCell>
                  <TableCell>{groupe.ville || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {groupe.user?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {groupe.isVerified && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Vérifié
                        </Badge>
                      )}
                      {groupe.isBoosted && (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1">
                          <Zap className="h-3 w-3" />
                          Boost
                        </Badge>
                      )}
                      {!groupe.isVisible && (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Masqué
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(groupe.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(groupe)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => quickToggle(groupe, "isVerified")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {groupe.isVerified ? "Retirer vérification" : "Vérifier"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => quickToggle(groupe, "isBoosted")}>
                          <Zap className="h-4 w-4 mr-2" />
                          {groupe.isBoosted ? "Retirer boost" : "Mettre en avant"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => quickToggle(groupe, "isVisible")}>
                          {groupe.isVisible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Afficher
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(groupe)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {editingGroupe?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom du groupe</Label>
              <Input
                id="edit-nom"
                value={editForm.nom}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, nom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ville">Ville</Label>
              <Input
                id="edit-ville"
                value={editForm.ville}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, ville: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-verified">Vérifié</Label>
              <Switch
                id="edit-verified"
                checked={editForm.isVerified}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, isVerified: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-boosted">Mis en avant</Label>
              <Switch
                id="edit-boosted"
                checked={editForm.isBoosted}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, isBoosted: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-visible">Visible</Label>
              <Switch
                id="edit-visible"
                checked={editForm.isVisible}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, isVisible: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe{" "}
              <strong>{deletingGroupe?.nom}</strong> ? Cette action est
              irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
