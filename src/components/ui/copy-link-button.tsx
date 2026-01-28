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
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          Copi&eacute; !
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          Copier le lien
        </>
      )}
    </Button>
  );
}
