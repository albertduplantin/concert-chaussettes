import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, AlertTriangle } from "lucide-react";
import { ReportActions } from "./report-actions";

export default async function AdminReportsPage() {
  const allReports = await db.query.reports.findMany({
    orderBy: [desc(reports.createdAt)],
    with: {
      reporter: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  const pending = allReports.filter((r) => r.status === "PENDING");
  const resolved = allReports.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Signalements</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des signalements utilisateurs
          </p>
        </div>
        {pending.length > 0 && (
          <Badge variant="destructive" className="gap-1.5 text-sm px-3 py-1">
            <AlertTriangle className="h-4 w-4" />
            {pending.length} en attente
          </Badge>
        )}
      </div>

      {allReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Flag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucun signalement</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les signalements des utilisateurs apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                En attente ({pending.length})
              </h2>
              {pending.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Traités ({resolved.length})
              </h2>
              {resolved.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportCard({
  report,
}: {
  report: {
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: Date;
    reporter: { id: string; name: string | null; email: string } | null;
  };
}) {
  const statusConfig = {
    PENDING: { label: "En attente", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    REVIEWED: { label: "Traité", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    DISMISSED: { label: "Ignoré", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  } as const;

  const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="capitalize text-xs">
                {report.targetType}
              </Badge>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(report.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="text-sm mb-2 leading-relaxed">{report.reason}</p>

            <p className="text-xs text-muted-foreground">
              Signalé par{" "}
              <span className="font-medium">
                {report.reporter?.name || report.reporter?.email || "Utilisateur inconnu"}
              </span>
              {report.reporter?.email && report.reporter.name && (
                <> ({report.reporter.email})</>
              )}
            </p>

            <p className="text-xs text-muted-foreground mt-0.5">
              Cible ID : <code className="font-mono bg-muted px-1 rounded">{report.targetId}</code>
            </p>
          </div>

          {report.status === "PENDING" && (
            <ReportActions reportId={report.id} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
