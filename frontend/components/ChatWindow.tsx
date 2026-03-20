"use client";
import { useState, useRef, useEffect } from "react";
import { SourceViewer } from "./SourceViewer";
import { SourceMetadata } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, HelpCircle } from "lucide-react";

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
          {messages.map((m, i) => (
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
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <SourceViewer sources={m.sources} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-full px-6 py-3 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#1A73E8]" />
                <span className="text-xs text-white/40 font-medium">Assistant is thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </div>
    </div>
  );
}