"use client";
import React, { useState, useRef, useEffect } from "react";
import { SourceViewer } from "./SourceViewer";
import { SourceMetadata } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceMetadata[];
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  toolName: string;
  hideInput?: boolean;
}

const THINKING_MESSAGES = [
  "Searching through the pages...",
  "Reading between the lines...",
  "Consulting the text...",
  "Gathering context...",
  "Piecing it together...",
  "Cross-referencing chapters...",
  "Analysing the content...",
];

function RotatingThinkingMessage() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return <span className="transition-all duration-500">{THINKING_MESSAGES[index]}</span>;
}

const CITATION_REGEX = /(\[Chunk \d+\]|\[p\.\s*\d+(?:\s*[-–—]\s*Chapter\s+[^\]]+)?\])/g;

function parseCitationLabel(citation: string): string {
  const chunkMatch = citation.match(/\[Chunk (\d+)\]/);
  if (chunkMatch) return chunkMatch[1];

  const pageMatch = citation.match(/\[p\.\s*(\d+)/i);
  if (pageMatch) return `p.${pageMatch[1]}`;

  return citation.slice(1, -1);
}

function findSourceForCitation(citation: string, sources: SourceMetadata[]): SourceMetadata | undefined {
  const chunkMatch = citation.match(/\[Chunk (\d+)\]/);
  if (chunkMatch) {
    const chunkNumber = chunkMatch[1];
    return sources.find((source) => {
      const id = source.chunk_id.toLowerCase();
      return (
        id === chunkNumber ||
        id === `chunk ${chunkNumber}` ||
        id === `chunk_${chunkNumber}` ||
        id.endsWith(chunkNumber)
      );
    });
  }

  const pageChapterMatch = citation.match(/\[p\.\s*(\d+)(?:\s*[-–—]\s*Chapter\s+([^\]]+))?\]/i);
  if (pageChapterMatch) {
    const page = Number(pageChapterMatch[1]);
    const chapter = pageChapterMatch[2]?.trim();

    return (
      sources.find((source) => {
        const pageMatches = source.page === page;
        const chapterMatches = chapter
          ? source.chapter && source.chapter.toLowerCase().includes(chapter.toLowerCase())
          : true;
        return pageMatches && chapterMatches;
      }) || sources.find((source) => source.page === page)
    );
  }

  return undefined;
}

function CitationMark({ citation, sources }: { citation: string; sources: SourceMetadata[] }) {
  const source = findSourceForCitation(citation, sources);
  const label = parseCitationLabel(citation);

  return (
    <span className="relative group inline-flex align-super leading-none">
      <sup className="text-[10px] font-bold text-[#1A73E8] bg-[#1A73E8]/10 px-0.5 rounded ml-0.5 cursor-help">
        {label}
      </sup>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[70vw] rounded-xl bg-[#202124] px-3 py-2 text-left opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 z-20">
        {source ? (
          <>
            <span className="block text-[11px] font-semibold text-white mb-1">
              {source.chunk_id}
              {source.page ? ` · p. ${source.page}` : ""}
              {source.chapter ? ` · ${source.chapter}` : ""}
            </span>
            <span className="block text-[11px] italic text-gray-300 leading-snug">“{source.excerpt}”</span>
          </>
        ) : (
          <span className="block text-[11px] italic text-gray-300">Source not found for this citation.</span>
        )}
      </span>
    </span>
  );
}

function renderStringWithCitations(text: string, sources: SourceMetadata[], keyPrefix: string | number) {
  const parts = text.split(CITATION_REGEX).filter((part) => part.length > 0);

  return parts.map((part, i) => {
    const isCitation = /^\[(Chunk \d+|p\.\s*\d+(?:\s*[-–—]\s*Chapter\s+[^\]]+)?)\]$/i.test(part);

    if (isCitation) {
      return <CitationMark key={`${keyPrefix}-${i}`} citation={part} sources={sources} />;
    }

    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

function renderTextWithCitations(children: React.ReactNode, sources: SourceMetadata[]): React.ReactNode {
  if (Array.isArray(children)) {
    return children.map((child, idx) => {
      if (typeof child === "string") {
        return renderStringWithCitations(child, sources, idx);
      }
      return <React.Fragment key={idx}>{child}</React.Fragment>;
    });
  }

  if (typeof children === "string") {
    return renderStringWithCitations(children, sources, 0);
  }

  return children;
}

export function ChatWindow({ messages, onSendMessage, isLoading, toolName, hideInput }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto min-h-full">
      <div className="flex-1">
        <div className="space-y-8">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-in fade-in duration-1000">
              <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                <HelpCircle className="h-12 w-12 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">How can I help you today?</h3>
              <p className="text-white/40 text-sm max-w-sm mx-auto">Select a tool on the left or type a question below to explore the contents of "{toolName}" Assistant.</p>
            </div>
          )}
          {messages.map((m, i) => {
            if (m.role === "assistant" && !m.content && (!m.sources || m.sources.length === 0)) return null;
            return (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed shadow-lg ${m.role === "user"
                    ? "bg-[#1A73E8] text-white shadow-[#1A73E8]/10"
                    : "bg-white/5 text-white border border-white/10 backdrop-blur-sm"
                    }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-4 last:mb-0">
                            {renderTextWithCitations(children, m.sources || [])}
                          </p>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1 last:mb-0">
                            {renderTextWithCitations(children, m.sources || [])}
                          </li>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <SourceViewer sources={m.sources} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#1A73E8] animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-[#1A73E8] animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-[#1A73E8] animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-white/40 font-medium italic">
                  <RotatingThinkingMessage />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </div>
    </div>
  );
}
