import { Music, Users, Star, CalendarCheck } from "lucide-react";

interface StatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="text-3xl md:text-4xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function TrustStats() {
  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <Stat
            icon={<Music className="h-8 w-8" />}
            value="150+"
            label="Groupes inscrits"
          />
          <Stat
            icon={<CalendarCheck className="h-8 w-8" />}
            value="500+"
            label="Concerts organisés"
          />
          <Stat
            icon={<Users className="h-8 w-8" />}
            value="2000+"
            label="Spectateurs heureux"
          />
          <Stat
            icon={<Star className="h-8 w-8" />}
            value="4.9"
            label="Note moyenne"
          />
        </div>
      </div>
    </section>
  );
}
