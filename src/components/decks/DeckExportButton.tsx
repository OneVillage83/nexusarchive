"use client";

import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import type { GameSlug } from "@/lib/games";
import type { DeckBuilderEntry } from "@/lib/decks/config";

type DeckExportButtonProps = {
  game: GameSlug;
  deckName: string;
  entries: DeckBuilderEntry[];
};

export function DeckExportButton({ deckName, entries }: DeckExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSortedDeckList = () => {
    return [...entries]
      .sort((a, b) => a.cardName.localeCompare(b.cardName))
      .map((entry) => `${entry.quantity} ${entry.cardName}`)
      .join("\n");
  };

  const handleCopy = async () => {
    const text = getSortedDeckList();
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.error("Failed to copy deck list:", err);
      setCopyStatus("Failed");
      setTimeout(() => setCopyStatus(null), 2000);
    }
    setIsOpen(false);
  };

  const handleDownloadTxt = () => {
    const text = getSortedDeckList();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_deck.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const text = getSortedDeckList();
    const lines = text.split("\n");

    doc.setFontSize(16);
    doc.text(deckName, 10, 15);
    doc.setFontSize(11);
    
    let y = 25;
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 10, y);
      y += 6;
    });

    doc.save(`${deckName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_deck.pdf`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
      >
        {copyStatus || "Export"}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/12 bg-[#090909]/96 shadow-[0_18px_38px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <button
            onClick={handleCopy}
            className="block w-full px-4 py-2.5 text-left text-sm text-amber-50 hover:bg-white/10 transition"
          >
            Copy to clipboard
          </button>
          <button
            onClick={handleDownloadTxt}
            className="block w-full px-4 py-2.5 text-left text-sm text-amber-50 hover:bg-white/10 transition border-t border-white/5"
          >
            Download .txt file
          </button>
          <button
            onClick={handleDownloadPdf}
            className="block w-full px-4 py-2.5 text-left text-sm text-amber-50 hover:bg-white/10 transition border-t border-white/5"
          >
            Download .pdf file
          </button>
        </div>
      )}
    </div>
  );
}
