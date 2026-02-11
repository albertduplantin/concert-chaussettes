"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Music, Loader2, Filter, X, Sparkles, Star, Navigation, List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupeCard } from "./groupe-card";
import dynamic from "next/dynamic";

const GroupesMap = dynamic(
  () => import("@/app/groupes/groupes-map").then((mod) => mod.GroupesMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    ),
  }
);

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
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  thumbnailUrl: string | null;
  youtubeVideos: string[];
  contactEmail: string | null;
  contactTel: string | null;
  contactSite: string | null;
  isVerified: boolean;
  isBoosted: boolean;
  genres: { id: string; nom: string }[];
  avgNote: number | null;
  avisCount: number;
}

interface GroupeSearchProps {
  genres: Genre[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [10, 30, 50, 100, 200];

export function GroupeSearch({ genres }: GroupeSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [ville, setVille] = useState("");
  const [departement, setDepartement] = useState("");
  const [region, setRegion] = useState("");
  const [minNote, setMinNote] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const [geoLoading, setGeoLoading] = useState(false);
  const [results, setResults] = useState<GroupeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const hasActiveFilters = search || ville || departement || region || selectedGenres.length > 0 || minNote > 0 || userLocation;

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  }

  function clearFilters() {
    setSearch("");
    setVille("");
    setDepartement("");
    setRegion("");
    setSelectedGenres([]);
    setMinNote(0);
    setUserLocation(null);
  }

  async function handleSearch() {
    setIsLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (ville) params.set("ville", ville);
    if (departement) params.set("departement", departement);
    if (region) params.set("region", region);
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));

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

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000 }
    );
  }, []);

  // Client-side filtering: note + radius
  const filteredResults = results.filter((g) => {
    if (minNote > 0 && (g.avgNote === null || g.avgNote < minNote)) return false;
    if (userLocation && g.latitude && g.longitude) {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, g.latitude, g.longitude);
      if (dist > radius) return false;
    }
    return true;
  });

  const groupesWithLocation = filteredResults.filter((g) => g.latitude && g.longitude);

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FilterContent = () => (
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
            <Input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="ex: Paris" className="bg-white dark:bg-gray-900" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Département</Label>
            <Input value={departement} onChange={(e) => setDepartement(e.target.value)} placeholder="ex: Côtes-d'Armor" className="bg-white dark:bg-gray-900" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Région</Label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="ex: Bretagne" className="bg-white dark:bg-gray-900" />
          </div>
        </div>
      </div>

      {/* Nearby */}
      <div>
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-orange-500" />
          Près de moi
        </Label>
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeolocate}
            disabled={geoLoading}
            className={cn(
              "border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20",
              userLocation && "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/20"
            )}
          >
            {geoLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
            {userLocation ? "Position activée" : "Me localiser"}
          </Button>
          {userLocation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rayon</span>
                <span className="text-orange-600 font-medium">{radius} km</span>
              </div>
              <Slider value={[radius]} onValueChange={([v]: number[]) => setRadius(v)} min={10} max={200} step={10} className="w-full" />
              <div className="flex justify-between">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded transition-colors",
                      radius === r ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note minimale */}
      <div>
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-orange-500" />
          Note minimale
        </Label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinNote(0)}
            className={cn("text-xs px-2 py-1 rounded mr-1 transition-colors", minNote === 0 ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground")}
          >
            Toutes
          </button>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMinNote(n === minNote ? 0 : n)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`${n} étoile minimum`}
            >
              <Star className={cn("h-5 w-5 transition-colors", n <= minNote ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600")} />
            </button>
          ))}
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
  );

  return (
    <div className="space-y-6">
      {/* Filtres card */}
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
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                Rechercher
              </Button>
            </div>
          </div>

          {/* Toggle filters + view mode */}
          <div className="px-6 py-3 border-b flex items-center justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              {hasActiveFilters && (
                <Badge className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                  actif
                </Badge>
              )}
            </button>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                  Effacer
                </button>
              )}
              {/* View mode toggle */}
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors", viewMode === "list" ? "bg-orange-500 text-white" : "hover:bg-muted")}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Liste</span>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={cn("px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors border-l", viewMode === "map" ? "bg-orange-500 text-white" : "hover:bg-muted")}
                >
                  <MapIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Carte</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter content (only in list mode, or always if showFilters) */}
          {showFilters && viewMode === "list" && <FilterContent />}
        </CardContent>
      </Card>

      {/* Results header */}
      {hasSearched && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredResults.length}</span> groupe{filteredResults.length !== 1 ? "s" : ""} trouvé{filteredResults.length !== 1 ? "s" : ""}
              {viewMode === "map" && groupesWithLocation.length !== filteredResults.length && (
                <span className="ml-2 text-orange-600">({groupesWithLocation.length} sur la carte)</span>
              )}
            </p>
            {filteredResults.some((g) => g.isBoosted) && (
              <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                <Sparkles className="h-3 w-3" />
                Mis en avant en premier
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* MAP MODE — sidebar layout */}
      {viewMode === "map" ? (
        <div className="flex gap-4" style={{ height: "calc(100vh - 360px)", minHeight: "500px" }}>
          {/* Sidebar filters */}
          {showFilters && (
            <div className="w-72 flex-shrink-0 overflow-y-auto bg-white/80 dark:bg-gray-900/80 rounded-xl border shadow-lg">
              <FilterContent />
            </div>
          )}
          {/* Map */}
          <div className="flex-1 relative">
            <GroupesMap
              groupes={groupesWithLocation}
              userLocation={userLocation}
              radius={radius}
            />
          </div>
        </div>
      ) : (
        /* LIST MODE */
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((groupe) => (
              <GroupeCard
                key={groupe.id}
                groupe={{ ...groupe, rating: groupe.avgNote ?? undefined }}
              />
            ))}
          </div>

          {hasSearched && filteredResults.length === 0 && !isLoading && (
            <Card className="p-12 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun groupe trouvé</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Essayez de modifier vos critères de recherche ou d&apos;élargir votre zone géographique.
              </p>
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Effacer les filtres
              </Button>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Recherche en cours...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
