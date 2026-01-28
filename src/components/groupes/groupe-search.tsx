"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Music, ExternalLink, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupeCard } from "./groupe-card";

interface Genre {
  id: string;
  nom: string;
  isCustom: boolean;
}

interface GroupeResult {
  id: string;
  nom: string;
  bio: string | null;
  ville: string | null;
  departement: string | null;
  region: string | null;
  youtubeVideos: string[];
  contactEmail: string | null;
  contactTel: string | null;
  contactSite: string | null;
  isVerified: boolean;
  isBoosted: boolean;
  genres: { id: string; nom: string }[];
}

interface GroupeSearchProps {
  genres: Genre[];
}

export function GroupeSearch({ genres }: GroupeSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [ville, setVille] = useState("");
  const [departement, setDepartement] = useState("");
  const [region, setRegion] = useState("");
  const [results, setResults] = useState<GroupeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  }

  async function handleSearch() {
    setIsLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (ville) params.set("ville", ville);
    if (departement) params.set("departement", departement);
    if (region) params.set("region", region);
    if (selectedGenres.length > 0)
      params.set("genres", selectedGenres.join(","));

    try {
      const res = await fetch(`/api/groupes/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.groupes || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Charger tous les groupes au premier rendu
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom du groupe..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ville</Label>
              <Input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div>
              <Label>D&eacute;partement</Label>
              <Input
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div>
              <Label>R&eacute;gion</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="&Icirc;le-de-France"
              />
            </div>
          </div>

          {genres.length > 0 && (
            <div>
              <Label className="mb-2 block">Genres</Label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant={
                      selectedGenres.includes(genre.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.nom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
            <Search className="h-4 w-4" />
            {isLoading ? "Recherche..." : "Rechercher"}
          </Button>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div>
        {hasSearched && (
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} groupe{results.length !== 1 ? "s" : ""} trouv&eacute;
            {results.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((groupe) => (
            <GroupeCard key={groupe.id} groupe={groupe} />
          ))}
        </div>

        {hasSearched && results.length === 0 && !isLoading && (
          <Card className="p-8 text-center">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun groupe trouv&eacute; avec ces crit&egrave;res.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
