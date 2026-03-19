"use client";

import { useState } from "react";
import { SourceMetadata } from "@/lib/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface SourceViewerProps {
  sources: SourceMetadata[];
}

export function SourceViewer({ sources }: SourceViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1 text-[10px] font-medium text-[#1A73E8] hover:underline uppercase tracking-wider">
          <BookOpen className="h-3 w-3" />
          {isOpen ? "Hide Sources" : "Show Sources"}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {sources.map((source, i) => (
          <div key={i} className="bg-white/50 rounded p-2 text-[11px] text-[#5F6368] border border-black/5">
            <div className="font-bold mb-1 flex justify-between">
              <span>{source.chunk_id}</span>
              <span>{source.page ? `p. ${source.page}` : source.chapter}</span>
            </div>
            <p className="italic">"{source.excerpt}"</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
