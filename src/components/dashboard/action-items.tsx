"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ChevronRight,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  id: string;
  type: "quote" | "message" | "urgent" | "info";
  title: string;
  description?: string;
  href: string;
  urgent?: boolean;
  deadline?: string;
}

interface ActionItemsProps {
  items: ActionItem[];
  className?: string;
}

const typeConfig = {
  quote: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  message: {
    icon: MessageSquare,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  urgent: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  info: {
    icon: Bell,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
};

export function ActionItems({ items, className }: ActionItemsProps) {
  if (items.length === 0) return null;

  const urgentCount = items.filter((item) => item.urgent).length;

  return (
    <Card className={cn(
      "border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden",
      urgentCount > 0 && "ring-2 ring-orange-400/50",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-base">Actions requises</CardTitle>
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
              {items.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-2">
          {items.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/50 group",
                  item.urgent && "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50"
                )}
              >
                <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.urgent && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                  )}
                  {item.deadline && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.deadline}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
