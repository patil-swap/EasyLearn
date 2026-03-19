"use client";
import { useState, useRef, useEffect } from "react";
import { SourceViewer } from "./SourceViewer";
import { SourceMetadata } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

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
}

export function ChatWindow({ messages, onSendMessage, isLoading, toolName }: ChatWindowProps) {
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
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#E8EAED] bg-[#F8F9FA]">
        <h3 className="font-semibold text-[#202124] capitalize">{toolName} Assistant</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[#5F6368]">Ask a question or select a tool to begin.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === "user"
                    ? "bg-[#1A73E8] text-white"
                    : "bg-[#F1F3F4] text-[#202124]"
                  }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.content.split(/(\[Chunk \d+\])/g).map((part, index) => {
                    const match = part.match(/\[Chunk (\d+)\]/);
                    if (match) {
                      return (
                        <sup 
                          key={index} 
                          className="text-[10px] font-bold text-[#1A73E8] bg-[#1A73E8]/10 px-0.5 rounded ml-0.5 cursor-help"
                          title={`Source Chunk ${match[1]}`}
                        >
                          {match[1]}
                        </sup>
                      );
                    }
                    return part;
                  })}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#D1D3D4]">
                    <SourceViewer sources={m.sources} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F1F3F4] rounded-2xl px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#5F6368]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#E8EAED] bg-white flex gap-2">
        <Input
          placeholder={toolName === "summary" ? "Click summary above..." : "Ask a question..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || toolName === "summary"}
          className="bg-[#F8F9FA] border-[#E8EAED] focus-visible:ring-[#1A73E8]"
        />
        <Button
          type="submit"
          disabled={isLoading || (toolName !== "summary" && !input.trim())}
          className="bg-[#1A73E8] hover:bg-[#165CB8]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}