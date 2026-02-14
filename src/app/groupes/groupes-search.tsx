"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Music, Filter, X, List, Map as MapIcon, ChevronRight, Star, Navigation, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import the map to avoid SSR issues
const GroupesMap = dynamic(() => import("./groupes-map").then((mod) => mod.GroupesMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
      <div className="text-muted-foreground">Chargement de la carte...</div>
    </div>
  ),
});

interface Genre {
  id: string;
  nom: string;
}

interface Groupe {
  id: string;
  nom: string;
  bio: string | null;
  ville: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  thumbnailUrl: string | null;
  photos: string[];
  isVerified: boolean;
  isBoosted: boolean;
  genres: { id: string; nom: string }[];
  avgNote: number | null;
  avisCount: number;
}

interface GroupesSearchProps {
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

export function GroupesSearch({ genres }: GroupesSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [ville, setVille] = useState("");
  const [departement, setDepartement] = useState("");
  const [region, setRegion] = useState("");
  const [minNote, setMinNote] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const [geoLoading, setGeoLoading] = useState(false);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch groupes when server-side filters change
  useEffect(() => {
    const fetchGroupes = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (ville) params.set("ville", ville);
        if (departement) params.set("departement", departement);
        if (region) params.set("region", region);
        if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));

        const res = await fetch(`/api/groupes/search?${params.toString()}`);
        const data = await res.json();
        setGroupes(data.groupes || []);
      } catch (error) {
        console.error("Error fetching groupes:", error);
        setGroupes([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchGroupes, 300);
    return () => clearTimeout(debounce);
  }, [query, ville, departement, region, selectedGenres]);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setVille("");
    setDepartement("");
    setRegion("");
    setSelectedGenres([]);
    setMinNote(0);
    setUserLocation(null);
  };

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
  const filteredGroupes = groupes.filter((g) => {
    if (minNote > 0 && (g.avgNote === null || g.avgNote < minNote)) return false;
    if (userLocation && g.latitude && g.longitude) {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, g.latitude, g.longitude);
      if (dist > radius) return false;
    }
    return true;
  });

  const hasFilters =
    query || ville || departement || region || selectedGenres.length > 0 || minNote > 0 || userLocation;

  // Groups with coordinates for map
  const groupesWithLocation = filteredGroupes.filter((g) => g.latitude && g.longitude);

  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Effacer les filtres
        </button>
      )}

      {/* Location filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Localisation</h3>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ville..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Input
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
          placeholder="Département (ex: Côtes-d'Armor)"
          className="h-9 text-sm"
        />
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Région (ex: Bretagne)"
          className="h-9 text-sm"
        />
      </div>

      {/* Nearby */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Près de moi</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGeolocate}
          disabled={geoLoading}
          className={cn(
            "w-full",
            userLocation && "border-orange-500 text-orange-600 dark:text-orange-400"
          )}
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {userLocation ? "Position activée" : "Me localiser"}
        </Button>
        {userLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rayon</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">{radius} km</span>
            </div>
            <Slider
              value={[radius]}
              onValueChange={([v]: number[]) => setRadius(v)}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded transition-colors",
                    radius === r
                      ? "bg-orange-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note minimale */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Note minimale</h3>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMinNote(n === minNote ? 0 : n)}
              className={cn(
                "p-1 transition-transform hover:scale-110",
                n === 0 && "text-xs text-muted-foreground hover:text-foreground self-center px-2"
              )}
              aria-label={n === 0 ? "Toutes les notes" : `${n} étoile minimum`}
            >
              {n === 0 ? (
                <span className={cn(minNote === 0 ? "text-orange-600 dark:text-orange-400" : "")}>Toutes</span>
              ) : (
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    n <= minNote ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Genres musicaux */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Genres musicaux</h3>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs transition-colors",
                selectedGenres.includes(genre.id)
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {genre.nom}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <main className="container mx-auto px-4 pb-12 flex-1">
      {/* Search bar — always visible */}
      <div className="max-w-4xl mx-auto mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="pl-12 h-14 rounded-xl text-lg"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-14 px-4",
              showFilters && "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
            )}
          >
            <Filter className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Filtres</span>
            {hasFilters && (
              <span className="ml-2 w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* View toggle and count */}
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
        <p className="text-muted-foreground text-sm">
          {isLoading ? (
            "Recherche en cours..."
          ) : (
            <>
              {filteredGroupes.length} groupe{filteredGroupes.length !== 1 ? "s" : ""}
              {groupesWithLocation.length > 0 && viewMode === "map" && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">
                  ({groupesWithLocation.length} sur la carte)
                </span>
              )}
            </>
          )}
        </p>
        <div className="flex rounded-lg overflow-hidden border">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-4 py-2 flex items-center gap-2 transition-colors",
              viewMode === "list" ? "bg-orange-500 text-white" : "hover:bg-muted"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "px-4 py-2 flex items-center gap-2 transition-colors border-l",
              viewMode === "map" ? "bg-orange-500 text-white" : "hover:bg-muted"
            )}
          >
            <MapIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Carte</span>
          </button>
        </div>
      </div>

      {/* List mode */}
      {viewMode === "list" ? (
        <div className="max-w-4xl mx-auto">
          {/* Filters panel */}
          {showFilters && (
            <Card className="mb-6 border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <FiltersPanel />
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-md animate-pulse">
                  <div className="w-full aspect-video bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : filteredGroupes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Music className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Aucun groupe trouvé</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Essayez avec d&apos;autres critères</p>
              </div>
            ) : (
              filteredGroupes.map((groupe) => <GroupeCard key={groupe.id} groupe={groupe} />)
            )}
          </div>
        </div>
      ) : (
        /* Map mode — sidebar layout */
        <div className="flex gap-4" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Filters sidebar */}
          {showFilters && (
            <Card className="w-72 flex-shrink-0 overflow-y-auto border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <FiltersPanel />
              </CardContent>
            </Card>
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
      )}
    </main>
  );
}

function StarRating({ avgNote, avisCount }: { avgNote: number | null; avisCount: number }) {
  if (!avgNote || avisCount === 0) return null;
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{avgNote.toFixed(1)}</span>
      <span className="text-muted-foreground text-xs">({avisCount})</span>
    </div>
  );
}

function GroupeCard({ groupe, compact = false }: { groupe: Groupe; compact?: boolean }) {
  const thumbnail = groupe.thumbnailUrl || groupe.photos?.[0];

  return (
    <Link
      href={`/groupes/${groupe.id}`}
      className={cn(
        "group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
        compact
          ? "flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl border"
          : "block rounded-xl border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden",
          compact ? "w-16 h-16 rounded-lg flex-shrink-0" : "aspect-video"
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={groupe.nom}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes={compact ? "64px" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
            <Music className={cn("text-muted-foreground/50", compact ? "h-6 w-6" : "h-12 w-12")} />
          </div>
        )}
        {groupe.isVerified && !compact && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white border-0 text-xs">Vérifié</Badge>
          </div>
        )}
        {groupe.isBoosted && !compact && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-xs">
              Mise en avant
            </Badge>
          </div>
        )}
        {!compact && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>

      {/* Content */}
      <div className={cn(compact ? "flex-1 min-w-0" : "p-4")}>
        <h3 className={cn("font-semibold truncate", compact ? "text-sm" : "text-lg mb-1")}>
          {groupe.nom}
        </h3>
        {groupe.ville && (
          <p
            className={cn(
              "text-muted-foreground flex items-center gap-1 truncate",
              compact ? "text-xs" : "text-sm mb-2"
            )}
          >
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {groupe.ville}
            {groupe.departement && !compact && `, ${groupe.departement}`}
          </p>
        )}
        {!compact && <StarRating avgNote={groupe.avgNote} avisCount={groupe.avisCount} />}
        {!compact && groupe.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {groupe.genres.slice(0, 3).map((genre) => (
              <Badge key={genre.id} variant="secondary" className="text-xs">
                {genre.nom}
              </Badge>
            ))}
            {groupe.genres.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{groupe.genres.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {compact && (
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors flex-shrink-0" />
      )}
    </Link>
  );
}
