"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ArrowRight, Music } from "lucide-react";

interface FeaturedGroup {
  id: string;
  nom: string;
  ville: string | null;
  departement: string | null;
  genres: { id: string; nom: string }[];
  thumbnailUrl: string | null;
  bio: string | null;
}

export function FeaturedGroups() {
  const [groups, setGroups] = useState<FeaturedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groupes/search?limit=4");
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groupes || []);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Groupes en vedette
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="pt-4">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Groupes en vedette
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez quelques-uns des artistes talentueux disponibles pour vos
            concerts privés
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {groups.map((group) => (
            <Link key={group.id} href={`/groupes/${group.id}`}>
            <Card
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                {group.thumbnailUrl ? (
                  <Image
                    src={group.thumbnailUrl}
                    alt={group.nom}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {group.nom}
                </h3>
                {(group.ville || group.departement) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[group.ville, group.departement].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {group.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {group.genres.slice(0, 3).map((genre) => (
                      <Badge key={genre.id} variant="secondary" className="text-xs">
                        {genre.nom}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/groupes">
              Voir tous les groupes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
