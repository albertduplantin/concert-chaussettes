"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Music, Loader2, Filter, X, Sparkles } from "lucide-react";
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
  photos: string[];
  thumbnailUrl: string | null;
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
  const [showFilters, setShowFilters] = useState(true);

  const hasActiveFilters = search || ville || departement || region || selectedGenres.length > 0;

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  }

  function clearFilters() {
    setSearch("");
    setVille("");
    setDepartement("");
    setRegion("");
    setSelectedGenres([]);
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
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Search header */}
          <div className="p-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un groupe par nom..."
                  className="pl-12 h-12 text-lg bg-white dark:bg-gray-900 border-0 shadow-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="h-12 px-6 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Rechercher
              </Button>
            </div>
          </div>

          {/* Toggle filters */}
          <div className="px-6 py-3 border-b flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              {hasActiveFilters && (
                <Badge className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                  {[search, ville, departement, region].filter(Boolean).length + selectedGenres.length} actif(s)
                </Badge>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Effacer
              </button>
            )}
          </div>

          {/* Filter content */}
          {showFilters && (
            <div className="p-6 space-y-6">
              {/* Location filters */}
              <div>
                <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Localisation
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Ville</Label>
                    <Input
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="ex: Paris"
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Département</Label>
                    <Input
                      value={departement}
                      onChange={(e) => setDepartement(e.target.value)}
                      placeholder="ex: Paris"
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Région</Label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="ex: Île-de-France"
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Genre filters */}
              {genres.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Music className="h-4 w-4 text-orange-500" />
                    Genres musicaux
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:scale-105",
                          selectedGenres.includes(genre.id)
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-sm"
                            : "hover:border-orange-300 dark:hover:border-orange-700"
                        )}
                        onClick={() => toggleGenre(genre.id)}
                      >
                        {genre.nom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        {hasSearched && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> groupe{results.length !== 1 ? "s" : ""} trouvé{results.length !== 1 ? "s" : ""}
            </p>
            {results.some(g => g.isBoosted) && (
              <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                <Sparkles className="h-3 w-3" />
                Groupes mis en avant en premier
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((groupe) => (
          <GroupeCard key={groupe.id} groupe={groupe} />
        ))}
      </div>

      {/* Empty state */}
      {hasSearched && results.length === 0 && !isLoading && (
        <Card className="p-12 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
            <Music className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun groupe trouvé</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Essayez de modifier vos critères de recherche ou d'élargir votre zone géographique.
          </p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Effacer les filtres
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Recherche en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
