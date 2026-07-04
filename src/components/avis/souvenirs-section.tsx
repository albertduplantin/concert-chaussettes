import { sanitizeYoutubeUrl } from "@/lib/sanitize";
import { Camera, ExternalLink } from "lucide-react";
import type { Souvenir } from "@/lib/souvenirs";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function SouvenirsSection({ souvenirs }: { souvenirs: Souvenir[] }) {
  if (souvenirs.length === 0) return null;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 border-t">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Camera className="h-6 w-6 text-orange-500" />
        Souvenirs des concerts
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Photos et vidéos partagées par les invités après leurs concerts.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {souvenirs.map((s, i) => {
          const embedUrl = sanitizeYoutubeUrl(s.url);
          return (
            <div key={i} className="rounded-xl overflow-hidden border shadow-sm bg-white/80 dark:bg-gray-900/80">
              {embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={`Souvenir - ${s.concertTitre}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="aspect-video flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 transition-colors"
                >
                  <ExternalLink className="h-6 w-6 text-orange-500" />
                  <span className="text-sm text-muted-foreground">{hostnameOf(s.url)}</span>
                </a>
              )}
              <div className="p-3 text-xs text-muted-foreground truncate">
                {s.concertTitre}
                {s.auteurNom && <span> · partagé par {s.auteurNom}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
