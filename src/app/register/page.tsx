"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Home, Guitar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "GROUPE" ? "GROUPE" : "ORGANISATEUR";

  const [role, setRole] = useState<"GROUPE" | "ORGANISATEUR">(defaultRole);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const nom = formData.get("nom") as string;

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, nom }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        setIsLoading(false);
        return;
      }

      // Connexion automatique après inscription
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        toast.success("Compte créé ! Connectez-vous.");
        router.push("/login");
      } else {
        toast.success("Bienvenue sur Concert Chaussettes !");
        window.location.href =
          role === "GROUPE" ? "/dashboard/groupe" : "/dashboard/organisateur";
      }
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Concert Chaussettes</span>
          </Link>
          <CardTitle className="text-2xl">Cr&eacute;er un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour commencer l&apos;aventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Choix du rôle */}
          <div className="mb-6">
            <Label className="mb-3 block">Vous &ecirc;tes...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("ORGANISATEUR")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  role === "ORGANISATEUR"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/25"
                )}
              >
                <Home
                  className={cn(
                    "h-8 w-8",
                    role === "ORGANISATEUR"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    role === "ORGANISATEUR"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Organisateur
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("GROUPE")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  role === "GROUPE"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/25"
                )}
              >
                <Guitar
                  className={cn(
                    "h-8 w-8",
                    role === "GROUPE"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    role === "GROUPE"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Groupe
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">
                {role === "GROUPE" ? "Nom du groupe" : "Votre nom"}
              </Label>
              <Input
                id="nom"
                name="nom"
                placeholder={
                  role === "GROUPE"
                    ? "Ex: Les Chaussettes Rouges"
                    : "Ex: Jean Dupont"
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 caract&egrave;res"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            D&eacute;j&agrave; un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
