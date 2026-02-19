"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.error || "Erreur de vérification");
        }
      } catch {
        setStatus("error");
        setMessage("Une erreur est survenue");
      }
    }
    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold">Vérification en cours...</h1>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold mb-3">Email vérifié !</h1>
            <p className="text-muted-foreground mb-8">
              Votre adresse email a été confirmée. Vous pouvez maintenant utiliser toutes les fonctionnalités de Concert Chaussettes.
            </p>
            <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Link href="/dashboard">Accéder à mon tableau de bord</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold mb-3">Lien invalide</h1>
            <p className="text-muted-foreground mb-8">{message}</p>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
