"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, X } from "lucide-react";

export function BoostSuccessBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  // Clean up the query param after showing
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard/groupe");
    }, 6000);
    return () => clearTimeout(timer);
  }, [router]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-green-800 dark:text-green-300">
          Boost activé avec succès !
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          Votre profil apparaît maintenant en tête des recherches pendant 30 jours.
        </p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          router.replace("/dashboard/groupe");
        }}
        className="text-green-600 hover:text-green-800 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
