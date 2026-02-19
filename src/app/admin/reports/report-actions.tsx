"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"REVIEWED" | "DISMISSED" | null>(null);

  async function handleAction(status: "REVIEWED" | "DISMISSED") {
    setIsLoading(status);
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
        onClick={() => handleAction("REVIEWED")}
        disabled={!!isLoading}
      >
        <CheckCircle className="h-4 w-4" />
        {isLoading === "REVIEWED" ? "..." : "Résolu"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-muted-foreground"
        onClick={() => handleAction("DISMISSED")}
        disabled={!!isLoading}
      >
        <XCircle className="h-4 w-4" />
        {isLoading === "DISMISSED" ? "..." : "Ignorer"}
      </Button>
    </div>
  );
}
