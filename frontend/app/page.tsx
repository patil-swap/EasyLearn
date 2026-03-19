"use client";

import { useState } from "react";
import { BookUploader } from "@/components/BookUploader";
import { ToolSelector } from "@/components/ToolSelector";
import { ChatWindow } from "@/components/ChatWindow";
import { api, SourceMetadata } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceMetadata[];
}

export default function Home() {
  const [book, setBook] = useState<{ id: string; title: string } | null>(null);
  const [bookType, setBookType] = useState<string>("fiction");
  const [activeTool, setActiveTool] = useState("question");
  const [difficulty, setDifficulty] = useState("standard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadComplete = (id: string, title: string) => {
    setBook({ id, title });
    setMessages([]); // Clear previous chat
  };

  const handleSendMessage = async (text: string) => {
    if (!book) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.executeQuery(
        book.id,
        activeTool,
        text,
        difficulty
      );
      const aiMessage: Message = { 
        role: "assistant", 
        content: response.answer,
        sources: response.sources
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Query failed", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    // Auto-trigger summary if selected
    if (tool === "summary" && book && messages.length === 0) {
      handleSendMessage("Summarize this book.");
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#1A73E8] mb-2">EasyLearn AI Assistant</h1>
        <p className="text-[#5F6368]">Your intelligent companion for deep book analysis.</p>
      </header>

      {!book ? (
        <div className="mt-12">
          <BookUploader onUploadComplete={handleUploadComplete} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-[#E8EAED] shadow-sm">
            <div>
              <p className="text-xs text-[#5F6368] uppercase tracking-wider font-bold">Currently Reading</p>
              <h2 className="text-lg font-semibold text-[#202124]">{book.title}</h2>
            </div>
            <button 
              className="text-sm text-[#1A73E8] hover:underline"
              onClick={() => setBook(null)}
            >
              Upload different book
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              <ToolSelector 
                activeTool={activeTool} 
                onToolChange={handleToolChange} 
                bookType={bookType} 
              />
              
              <ChatWindow 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
                toolName={activeTool}
              />
            </div>

            <div className="space-y-6">
              {activeTool === "concept" && (
                <Card className="p-4 border-[#E8EAED]">
                  <Label className="mb-2 block">Adaptive Clarity</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simplified">Simplified (5th Grade)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="advanced">Advanced (Researcher)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-[11px] text-[#5F6368]">
                    Adjust how the assistant explains complex concepts.
                  </p>
                </Card>
              )}
              
              <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E8EAED]">
                <h4 className="text-sm font-bold text-[#202124] mb-2">Tool Guide</h4>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  {activeTool === "summary" && "Generates a < 200 word summary highlighting main themes."}
                  {activeTool === "question" && "Ask anything about the book's content."}
                  {activeTool === "character_arc" && "Synthesizes the journey of any character mentioned."}
                  {activeTool === "plot" && "Summarizes specific chapters or the narrative arc."}
                  {activeTool === "concept" && "Simplifies academic or technical concepts."}
                  {activeTool === "problem" && "Provides step-by-step methods for educational problems."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
