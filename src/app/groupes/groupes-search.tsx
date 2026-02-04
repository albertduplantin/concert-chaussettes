"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Music, Filter, X, List, Map as MapIcon, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import the map to avoid SSR issues
const GroupesMap = dynamic(() => import("./groupes-map").then((mod) => mod.GroupesMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-white/5 rounded-xl flex items-center justify-center">
      <div className="text-white/60">Chargement de la carte...</div>
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
}

interface GroupesSearchProps {
  genres: Genre[];
}

export function GroupesSearch({ genres }: GroupesSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [ville, setVille] = useState("");
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch groupes when filters change
  useEffect(() => {
    const fetchGroupes = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (ville) params.set("ville", ville);
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
  }, [query, ville, selectedGenres]);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setVille("");
    setSelectedGenres([]);
  };

  const hasFilters = query || ville || selectedGenres.length > 0;

  // Groups with coordinates for map
  const groupesWithLocation = groupes.filter((g) => g.latitude && g.longitude);

  return (
    <main className="container mx-auto px-4 pb-12">
      {/* Search bar */}
      <div className="max-w-4xl mx-auto mb-8 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-lg"
            />
          </div>
          <div className="relative w-48">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ville..."
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-14 px-4 border-white/10 hover:bg-white/10",
              showFilters && "bg-white/10"
            )}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Genre filters */}
        {showFilters && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Genres musicaux</h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Effacer les filtres
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                    selectedGenres.includes(genre.id)
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                  {genre.nom}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View toggle and results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/60">
          {isLoading ? (
            "Recherche en cours..."
          ) : (
            <>
              {groupes.length} groupe{groupes.length !== 1 ? "s" : ""} trouve{groupes.length !== 1 ? "s" : ""}
              {groupesWithLocation.length > 0 && viewMode === "map" && (
                <span className="ml-2 text-orange-400">
                  ({groupesWithLocation.length} sur la carte)
                </span>
              )}
            </>
          )}
        </p>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-4 py-2 flex items-center gap-2 transition-colors",
              viewMode === "list" ? "bg-white/10" : "hover:bg-white/5"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "px-4 py-2 flex items-center gap-2 transition-colors border-l border-white/10",
              viewMode === "map" ? "bg-white/10" : "hover:bg-white/5"
            )}
          >
            <MapIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Carte</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="w-full aspect-video bg-white/10 rounded-lg mb-4" />
                <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            ))
          ) : groupes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Music className="h-12 w-12 mx-auto text-white/40 mb-4" />
              <p className="text-white/60">Aucun groupe trouve</p>
              <p className="text-sm text-white/40 mt-1">Essayez avec d&apos;autres criteres</p>
            </div>
          ) : (
            groupes.map((groupe) => (
              <GroupeCard key={groupe.id} groupe={groupe} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Map */}
          <GroupesMap groupes={groupesWithLocation} />

          {/* List below map */}
          {groupesWithLocation.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {groupesWithLocation.slice(0, 8).map((groupe) => (
                <GroupeCard key={groupe.id} groupe={groupe} compact />
              ))}
            </div>
          )}

          {/* Groups without location */}
          {groupes.length > groupesWithLocation.length && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4 text-white/70">
                Autres groupes ({groupes.length - groupesWithLocation.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupes
                  .filter((g) => !g.latitude || !g.longitude)
                  .map((groupe) => (
                    <GroupeCard key={groupe.id} groupe={groupe} compact />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function GroupeCard({ groupe, compact = false }: { groupe: Groupe; compact?: boolean }) {
  const thumbnail = groupe.thumbnailUrl || groupe.photos?.[0];

  return (
    <Link
      href={`/groupes/${groupe.id}`}
      className={cn(
        "group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all hover:scale-[1.02]",
        compact ? "flex items-center gap-3 p-3" : "block"
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden",
        compact ? "w-16 h-16 rounded-lg flex-shrink-0" : "aspect-video"
      )}>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={groupe.nom}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes={compact ? "64px" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center">
            <Music className={cn("text-white/50", compact ? "h-6 w-6" : "h-12 w-12")} />
          </div>
        )}
        {groupe.isVerified && !compact && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white border-0 text-xs">Verifie</Badge>
          </div>
        )}
        {groupe.isBoosted && !compact && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-orange-500 text-white border-0 text-xs">Mise en avant</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(compact ? "flex-1 min-w-0" : "p-4")}>
        <h3 className={cn(
          "font-semibold truncate",
          compact ? "text-sm" : "text-lg mb-1"
        )}>
          {groupe.nom}
        </h3>
        {groupe.ville && (
          <p className={cn(
            "text-white/60 flex items-center gap-1 truncate",
            compact ? "text-xs" : "text-sm mb-3"
          )}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {groupe.ville}
            {groupe.departement && !compact && `, ${groupe.departement}`}
          </p>
        )}
        {!compact && groupe.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {groupe.genres.slice(0, 3).map((genre) => (
              <Badge
                key={genre.id}
                variant="outline"
                className="text-xs border-white/20 text-white/70"
              >
                {genre.nom}
              </Badge>
            ))}
            {groupe.genres.length > 3 && (
              <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                +{groupe.genres.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {compact && (
        <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-orange-400 transition-colors flex-shrink-0" />
      )}
    </Link>
  );
}
