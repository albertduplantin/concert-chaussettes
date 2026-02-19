"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (dismissed) return null;

  async function resendVerification() {
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("Email de vérification renvoyé !");
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-4 py-3">
      <div className="container max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
        <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          Votre adresse email n&apos;est pas encore vérifiée. Vérifiez vos spams ou renvoyez l&apos;email.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 h-7"
            onClick={resendVerification}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Renvoyer
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
