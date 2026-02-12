"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Heart } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "favoris_groupes";

function getFavoris(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

interface Props {
  groupeId: string;
  groupeNom: string;
}

export function GroupeActionButtons({ groupeId, groupeNom }: Props) {
  const [isFavori, setIsFavori] = useState(false);

  useEffect(() => {
    setIsFavori(getFavoris().includes(groupeId));
  }, [groupeId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: groupeNom, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const handleFavori = () => {
    const favoris = getFavoris();
    let next: string[];
    if (favoris.includes(groupeId)) {
      next = favoris.filter((id) => id !== groupeId);
      setIsFavori(false);
      toast("Retiré des favoris");
    } else {
      next = [...favoris, groupeId];
      setIsFavori(true);
      toast.success(`${groupeNom} ajouté aux favoris !`);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={handleShare}
        title="Partager ce groupe"
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full transition-colors"
        onClick={handleFavori}
        title={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavori ? "fill-red-500 text-red-500" : ""
          }`}
        />
      </Button>
    </div>
  );
}
