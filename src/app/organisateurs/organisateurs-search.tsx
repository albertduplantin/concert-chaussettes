"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Filter, X, Home, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Organisateur {
  id: string;
  nom: string;
  bio: string | null;
  ville: string | null;
  departement: string | null;
  region: string | null;
  thumbnailUrl: string | null;
  photos: string[];
  capaciteMax: number | null;
  equipements: string[];
  avgNote: number | null;
  avisCount: number;
}

export function OrganisateursSearch() {
  const [query, setQuery] = useState("");
  const [ville, setVille] = useState("");
  const [departement, setDepartement] = useState("");
  const [region, setRegion] = useState("");
  const [capaciteMin, setCapaciteMin] = useState("");
  const [organisateurs, setOrganisateurs] = useState<Organisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchOrganisateurs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (ville) params.set("ville", ville);
        if (departement) params.set("departement", departement);
        if (region) params.set("region", region);
        if (capaciteMin) params.set("capaciteMin", capaciteMin);

        const res = await fetch(`/api/organisateurs/search?${params.toString()}`);
        const data = await res.json();
        setOrganisateurs(data.organisateurs || []);
      } catch (error) {
        console.error("Error fetching organisateurs:", error);
        setOrganisateurs([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchOrganisateurs, 300);
    return () => clearTimeout(debounce);
  }, [query, ville, departement, region, capaciteMin]);

  const clearFilters = () => {
    setQuery("");
    setVille("");
    setDepartement("");
    setRegion("");
    setCapaciteMin("");
  };

  const hasFilters = query || ville || departement || region || capaciteMin;

  return (
    <main className="container mx-auto px-4 pb-12 flex-1">
      {/* Search bar */}
      <div className="max-w-4xl mx-auto mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un organisateur..."
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

        {showFilters && (
          <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Effacer les filtres
                </button>
              )}
              <div className="grid sm:grid-cols-4 gap-3">
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
                  placeholder="Département"
                  className="h-9 text-sm"
                />
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Région"
                  className="h-9 text-sm"
                />
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    value={capaciteMin}
                    onChange={(e) => setCapaciteMin(e.target.value)}
                    placeholder="Jauge min."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Count */}
      <p className="text-muted-foreground text-sm mb-4 max-w-4xl mx-auto">
        {isLoading
          ? "Recherche en cours..."
          : `${organisateurs.length} organisateur${organisateurs.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : organisateurs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Home className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Aucun organisateur trouvé</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Essayez avec d&apos;autres critères</p>
          </div>
        ) : (
          organisateurs.map((organisateur) => (
            <OrganisateurCard key={organisateur.id} organisateur={organisateur} />
          ))
        )}
      </div>
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

function OrganisateurCard({ organisateur }: { organisateur: Organisateur }) {
  const thumbnail = organisateur.thumbnailUrl || organisateur.photos?.[0];

  return (
    <Link
      href={`/organisateurs/${organisateur.id}`}
      className="group block overflow-hidden rounded-xl border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={organisateur.nom}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {organisateur.capaciteMax && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm gap-1">
              <Users className="h-3 w-3" />
              {organisateur.capaciteMax}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold truncate text-lg mb-1">{organisateur.nom}</h3>
        {organisateur.ville && (
          <p className="text-muted-foreground flex items-center gap-1 truncate text-sm mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {organisateur.ville}
            {organisateur.departement && `, ${organisateur.departement}`}
          </p>
        )}
        <StarRating avgNote={organisateur.avgNote} avisCount={organisateur.avisCount} />
        {organisateur.equipements.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {organisateur.equipements.slice(0, 3).map((eq) => (
              <Badge key={eq} variant="secondary" className="text-xs">
                {eq}
              </Badge>
            ))}
            {organisateur.equipements.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{organisateur.equipements.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
