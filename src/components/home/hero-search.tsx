"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Music2 } from "lucide-react";

const GENRES = [
  "Acoustic",
  "Blues",
  "Chanson française",
  "Folk",
  "Jazz",
  "Pop",
  "Rock",
  "Soul",
  "Swing",
  "World",
];

const REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Hauts-de-France",
  "Provence-Alpes-Côte d'Azur",
  "Grand Est",
  "Pays de la Loire",
  "Bretagne",
  "Normandie",
];

export function HeroSearch() {
  const router = useRouter();
  const [ville, setVille] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (ville) params.set("ville", ville);
    if (region) params.set("region", region);
    if (genre) params.set("genre", genre);

    router.push(`/dashboard/organisateur?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Genre musical" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSearch}
            size="lg"
            className="h-12 text-base gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Search className="h-5 w-5" />
            Rechercher
          </Button>
        </div>
      </div>
    </div>
  );
}
