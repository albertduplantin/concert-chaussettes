"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copie !
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copier le lien
        </>
      )}
    </Button>
  );
}
