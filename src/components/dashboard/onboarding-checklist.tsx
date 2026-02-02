"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Circle,
  Rocket,
  X,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  href?: string;
  action?: string;
}

interface OnboardingChecklistProps {
  title?: string;
  items: ChecklistItem[];
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

export function OnboardingChecklist({
  title = "Démarrage rapide",
  items,
  onDismiss,
  dismissible = true,
  className,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const completedCount = items.filter((item) => item.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const nextItem = items.find((item) => !item.completed);
  const allCompleted = completedCount === items.length;

  // Estimate remaining time (1 min per incomplete item)
  const remainingMinutes = items.length - completedCount;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (allCompleted) {
    return (
      <Card className={cn("border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Félicitations ! Votre profil est complet
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Vous êtes prêt à utiliser Concert Chaussettes.
              </p>
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
              <Rocket className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{items.length} étapes
                </span>
                {remainingMinutes > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~{remainingMinutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                item.completed
                  ? "bg-green-50/50 dark:bg-green-950/20"
                  : nextItem?.id === item.id
                  ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                  : "bg-muted/30"
              )}
            >
              <div className="mt-0.5">
                {item.completed ? (
                  <div className="p-1 rounded-full bg-green-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className={cn(
                    "p-1 rounded-full border-2",
                    nextItem?.id === item.id
                      ? "border-orange-500 bg-orange-100 dark:bg-orange-900/30"
                      : "border-muted-foreground/30"
                  )}>
                    <Circle className={cn(
                      "h-3 w-3",
                      nextItem?.id === item.id
                        ? "text-orange-500"
                        : "text-transparent"
                    )} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  item.completed && "text-muted-foreground line-through"
                )}>
                  {item.title}
                </p>
                {item.description && !item.completed && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              {!item.completed && item.href && nextItem?.id === item.id && (
                <Button
                  size="sm"
                  asChild
                  className="gap-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Link href={item.href}>
                    {item.action || "Faire"}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {nextItem && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Conseil :</strong> Les profils complets reçoivent 3x plus de demandes !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
