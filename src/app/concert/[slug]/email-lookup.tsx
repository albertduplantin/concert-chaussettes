"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Mail, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmailLookupProps {
  concertId: string;
}

export function EmailLookup({ concertId }: EmailLookupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    inscription?: {
      prenom: string | null;
      nom: string;
      status: string;
      nombrePersonnes: number;
    };
    managementUrl?: string;
  } | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/inscriptions/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, concertId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || data.error || "Aucune inscription trouvee");
        return;
      }

      setResult(data);
    } catch {
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsLoading(false);
    }
  }

  const statusConfig = {
    CONFIRME: {
      label: "Confirme",
      icon: CheckCircle,
      color: "text-green-400",
    },
    LISTE_ATTENTE: {
      label: "Liste d'attente",
      icon: Clock,
      color: "text-yellow-400",
    },
    ANNULE: {
      label: "Annule",
      icon: XCircle,
      color: "text-red-400",
    },
  };

  return (
    <div className="border-t border-white/10 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-white/60 hover:text-white/80 transition-colors py-2"
      >
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Deja inscrit ? Retrouvez votre inscription
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {result ? (
            <div className="bg-gray-800 rounded-xl p-4 space-y-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {result.inscription?.prenom} {result.inscription?.nom}
                  </p>
                  <p className="text-sm text-white/60">
                    {result.inscription?.nombrePersonnes} place{(result.inscription?.nombrePersonnes || 0) > 1 ? "s" : ""}
                  </p>
                </div>
                {result.inscription?.status && (
                  <div className={cn(
                    "flex items-center gap-1",
                    statusConfig[result.inscription.status as keyof typeof statusConfig]?.color
                  )}>
                    {(() => {
                      const config = statusConfig[result.inscription.status as keyof typeof statusConfig];
                      const Icon = config?.icon || CheckCircle;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span className="text-sm">
                      {statusConfig[result.inscription.status as keyof typeof statusConfig]?.label}
                    </span>
                  </div>
                )}
              </div>

              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Link href={result.managementUrl || "#"}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Gerer mon inscription
                </Link>
              </Button>

              <button
                onClick={() => {
                  setResult(null);
                  setEmail("");
                }}
                className="w-full text-center text-sm text-white/50 hover:text-white/70"
              >
                Rechercher avec un autre email
              </button>
            </div>
          ) : (
            <form onSubmit={handleLookup} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email d'inscription"
                required
                disabled={isLoading}
                className="flex-1 bg-gray-800 border-white/20 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
