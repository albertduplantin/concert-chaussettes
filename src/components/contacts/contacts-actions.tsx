"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Share2, UserPlus } from "lucide-react";
import { ContactImportDialog } from "./contact-import-dialog";
import { ContactShareDialog } from "./contact-share-dialog";
import { ContactAddDialog } from "./contact-add-dialog";

interface Props {
  contactsCount: number;
}

export function ContactsActions({ contactsCount }: Props) {
  const [importOpen, setImportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white backdrop-blur-sm"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
          className="gap-2 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white backdrop-blur-sm"
        >
          <Upload className="h-4 w-4" />
          Importer
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white backdrop-blur-sm"
        >
          <a href="/api/organisateur/contacts/export" download>
            <Download className="h-4 w-4" />
            Exporter CSV
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShareOpen(true)}
          className="gap-2 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white backdrop-blur-sm"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>

      <ContactAddDialog open={addOpen} onOpenChange={setAddOpen} />
      <ContactImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ContactShareDialog open={shareOpen} onOpenChange={setShareOpen} contactsCount={contactsCount} />
    </>
  );
}
