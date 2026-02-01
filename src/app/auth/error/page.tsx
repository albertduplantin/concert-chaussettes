"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Erreur de configuration",
    description:
      "Il y a un problème avec la configuration du serveur. Veuillez contacter l'administrateur.",
  },
  AccessDenied: {
    title: "Accès refusé",
    description:
      "Vous n'avez pas la permission d'accéder à cette ressource. Vérifiez que vous utilisez le bon compte.",
  },
  Verification: {
    title: "Lien expiré",
    description:
      "Le lien de vérification a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.",
  },
  OAuthSignin: {
    title: "Erreur de connexion OAuth",
    description:
      "Impossible de démarrer la connexion avec le fournisseur externe. Veuillez réessayer.",
  },
  OAuthCallback: {
    title: "Erreur de callback OAuth",
    description:
      "Une erreur s'est produite lors du retour du fournisseur d'authentification.",
  },
  OAuthCreateAccount: {
    title: "Erreur de création de compte",
    description:
      "Impossible de créer votre compte avec ce fournisseur. L'email est peut-être déjà utilisé.",
  },
  EmailCreateAccount: {
    title: "Erreur de création de compte",
    description: "Impossible de créer votre compte avec cet email.",
  },
  Callback: {
    title: "Erreur de callback",
    description: "Une erreur s'est produite lors de la vérification de votre identité.",
  },
  OAuthAccountNotLinked: {
    title: "Compte non lié",
    description:
      "Cet email est déjà associé à un autre compte. Connectez-vous avec votre méthode habituelle.",
  },
  EmailSignin: {
    title: "Erreur d'envoi d'email",
    description:
      "Impossible d'envoyer l'email de connexion. Vérifiez votre adresse email.",
  },
  CredentialsSignin: {
    title: "Identifiants incorrects",
    description:
      "L'email ou le mot de passe est incorrect. Veuillez vérifier vos informations.",
  },
  SessionRequired: {
    title: "Connexion requise",
    description: "Vous devez être connecté pour accéder à cette page.",
  },
  Default: {
    title: "Erreur d'authentification",
    description:
      "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "Default";
  const error = errorMessages[errorType] || errorMessages.Default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl">{error.title}</CardTitle>
        <CardDescription className="mt-2">{error.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button asChild>
          <Link href="/login" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer de se connecter
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
