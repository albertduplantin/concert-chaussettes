"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Music, X, MapPin } from "lucide-react";

interface Groupe {
  id: string;
  nom: string;
  bio: string | null;
  ville: string | null;
  region: string | null;
  genres: { id: string; nom: string }[];
}

interface GroupeSelectProps {
  value: string | null;
  onChange: (groupeId: string | null, groupe: Groupe | null) => void;
  initialGroupe?: Groupe | null;
}

export function GroupeSelect({ value, onChange, initialGroupe }: GroupeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(initialGroupe || null);

  // Fetch group data when we have an ID but no group info (e.g. from URL param)
  useEffect(() => {
    if (value && !selectedGroupe && !initialGroupe) {
      async function fetchGroupe() {
        try {
          const res = await fetch(`/api/groupes/search?q=`);
          if (res.ok) {
            const data = await res.json();
            const found = data.groupes?.find((g: Groupe) => g.id === value);
            if (found) {
              setSelectedGroupe(found);
            }
          }
        } catch {
          // ignore
        }
      }
      fetchGroupe();
    }
  }, [value, selectedGroupe, initialGroupe]);

  useEffect(() => {
    if (initialGroupe) {
      setSelectedGroupe(initialGroupe);
    }
  }, [initialGroupe]);

  useEffect(() => {
    if (!open) return;

    async function fetchGroupes() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        const res = await fetch(`/api/groupes/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setGroupes(data.groupes);
        }
      } catch {
        console.error("Erreur chargement groupes");
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchGroupes, 300);
    return () => clearTimeout(debounce);
  }, [open, search]);

  function handleSelect(groupe: Groupe) {
    setSelectedGroupe(groupe);
    onChange(groupe.id, groupe);
    setOpen(false);
  }

  function handleClear() {
    setSelectedGroupe(null);
    onChange(null, null);
  }

  return (
    <div className="space-y-2">
      <Label>Groupe</Label>
      {selectedGroupe ? (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedGroupe.nom}</p>
              {selectedGroupe.ville && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedGroupe.ville}
                  {selectedGroupe.region && `, ${selectedGroupe.region}`}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Search className="h-4 w-4" />
              Rechercher un groupe...
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Choisir un groupe</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-[300px] space-y-2 mt-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  Chargement...
                </p>
              ) : groupes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun groupe trouv&eacute;
                </p>
              ) : (
                groupes.map((groupe) => (
                  <button
                    key={groupe.id}
                    onClick={() => handleSelect(groupe)}
                    className="w-full p-3 border rounded-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{groupe.nom}</p>
                        {groupe.ville && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {groupe.ville}
                            {groupe.region && `, ${groupe.region}`}
                          </p>
                        )}
                        {groupe.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {groupe.genres.slice(0, 3).map((g) => (
                              <Badge key={g.id} variant="secondary" className="text-xs">
                                {g.nom}
                              </Badge>
                            ))}
                            {groupe.genres.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{groupe.genres.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
