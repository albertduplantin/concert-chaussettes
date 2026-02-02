import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-orange-600",
  iconBg = "bg-orange-100 dark:bg-orange-900/30",
  trend,
  subtitle,
  className,
}: StatsCardProps) {
  const trendIsPositive = trend && trend.value > 0;
  const trendIsNegative = trend && trend.value < 0;

  return (
    <Card className={cn(
      "border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {(trend || subtitle) && (
              <div className="flex items-center gap-2 mt-1">
                {trend && (
                  <span className={cn(
                    "text-xs font-medium flex items-center gap-0.5",
                    trendIsPositive && "text-green-600",
                    trendIsNegative && "text-red-600",
                    !trendIsPositive && !trendIsNegative && "text-muted-foreground"
                  )}>
                    {trendIsPositive && <TrendingUp className="h-3 w-3" />}
                    {trendIsNegative && <TrendingDown className="h-3 w-3" />}
                    {trendIsPositive && "+"}
                    {trend.value}%
                    {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
