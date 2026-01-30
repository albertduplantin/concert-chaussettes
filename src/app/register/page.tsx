"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      // Pour Google, on redirige vers le dashboard, le rôle sera défini par défaut
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Erreur de connexion avec Google");
      setIsGoogleLoading(false);
    }
  }

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
          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full gap-2 mb-4"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            <GoogleIcon className="h-5 w-5" />
            {isGoogleLoading ? "Inscription..." : "S'inscrire avec Google"}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Choix du rôle */}
          <div className="mb-6">
            <Label className="mb-3 block">Vous êtes...</Label>
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
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
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
