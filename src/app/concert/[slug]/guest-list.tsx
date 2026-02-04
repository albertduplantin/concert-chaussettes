"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Guest {
  prenom: string | null;
  nombrePersonnes: number;
}

interface GuestListProps {
  guests: Guest[];
  totalCount: number;
}

export function GuestList({ guests, totalCount }: GuestListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (guests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-left">
            <p className="font-medium">Liste des invites</p>
            <p className="text-sm text-white/60">
              {totalCount} personne{totalCount > 1 ? "s" : ""} inscrite{totalCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-full bg-white/10 transition-transform duration-200",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {/* Expandable content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="border-t border-white/10 p-4">
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {guests.map((guest, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">
                    {guest.prenom || "Invite"}
                  </span>
                </div>
                {guest.nombrePersonnes > 1 && (
                  <span className="text-sm text-white/60 bg-white/10 px-2 py-1 rounded-full">
                    +{guest.nombrePersonnes - 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 text-center mt-4">
            Seuls les prenoms des invites qui ont accepte d&apos;apparaitre sont affiches
          </p>
        </div>
      </div>
    </div>
  );
}
