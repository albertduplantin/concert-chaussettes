import { Music } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Concert Chaussettes
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Des concerts intimes, chez vous.
          </p>
        </div>
      </div>
    </footer>
  );
}
