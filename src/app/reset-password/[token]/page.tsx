"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = params.token as string;
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-3">
              {success ? (
                <CheckCircle className="h-7 w-7 text-green-500" />
              ) : (
                <Lock className="h-7 w-7 text-orange-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {success ? "Mot de passe modifié !" : "Nouveau mot de passe"}
            </CardTitle>
            <CardDescription>
              {success
                ? "Votre mot de passe a été réinitialisé. Redirection vers la connexion..."
                : "Choisissez un nouveau mot de passe pour votre compte."}
            </CardDescription>
          </CardHeader>

          {!success && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <PasswordInput
                    id="password"
                    placeholder="8 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <PasswordInput
                    id="confirm"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : "Enregistrer le mot de passe"}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
