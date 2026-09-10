"use client";

import { useState } from "react";
import { BookUploader } from "@/components/BookUploader";
import { ToolSelector } from "@/components/ToolSelector";
import { ChatWindow } from "@/components/ChatWindow";
import { UpgradeModal } from "@/components/UpgradeModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { api, SourceMetadata } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Book, FileText, Send, Loader2, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceMetadata[];
  toolName?: string;
  queryText?: string;
}

const isPaidUser = process.env.NEXT_PUBLIC_ENABLE_PAID_FEATURES === "true";

export default function Home() {
  const [book, setBook] = useState<{ id: string; title: string; cover_data?: string | null } | null>(null);
  const [bookType, setBookType] = useState<string>("fiction");
  const [activeTool, setActiveTool] = useState("question");
  const [difficulty, setDifficulty] = useState("standard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [essayScope, setEssayScope] = useState("entire_book");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [feedbackRatings, setFeedbackRatings] = useState<Record<number, "up" | "down">>({});
  const [feedbackModalIndex, setFeedbackModalIndex] = useState<number | null>(null);
  const [sessionId] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
  });

  const handleUploadComplete = (
    id: string,
    title: string,
    cover_data?: string | null,
    uploadedBookType?: string
  ) => {
    setBook({ id, title, cover_data });
    if (uploadedBookType === "fiction" || uploadedBookType === "educational") {
      setBookType(uploadedBookType);
    }
    setMessages([]);
    setFeedbackRatings({});
    setFeedbackModalIndex(null);
    setActiveTool("summary");
    setChatInput("Summarize this book.");
  };

  const handleNewConversation = () => {
    if (!book) return;

    setMessages([]);
    setChatInput("");
    setFeedbackRatings({});
    setFeedbackModalIndex(null);

    api.clearMemory(book.id).catch(() => {
      // Fail silently for UX
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!book) return;
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, toolName: activeTool, queryText: text },
      { role: "assistant", content: "", toolName: activeTool, queryText: text },
    ]);

    await api.streamQuery(
      book.id,
      activeTool,
      text,
      difficulty,
      (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      },
      (sources) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            sources,
          };
          return updated;
        });
      },
      () => setIsLoading(false),
      (error) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: `Error: ${error}`,
          };
          return updated;
        });
        setIsLoading(false);
      },
      essayScope
    );
  };

  const [chatInput, setChatInput] = useState("");

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);

    const toolPrefixes: Record<string, string> = {
      summary: "Summarize this book.",
      character_arc: "Analyze the character arc of: ",
      plot: "Explain the plot points regarding: ",
      concept: "Explain the concept of: ",
      problem: "How can I solve the problem of: ",
      essay_outline: "Generate an essay outline on: ",
      question: ""
    };

    const prefix = toolPrefixes[toolId] || "";
    setChatInput(prefix);

    if (toolId === "summary") {
      handleSendMessage("Summarize this book.");
      setChatInput("");
    }
  };

  const submitFeedback = (
    index: number,
    rating: "up" | "down",
    reasons: string[] | null = null,
    comment: string | null = null
  ) => {
    const msg = messages[index];
    if (!msg) return;

    api.submitFeedback({
      book_id: book!.id,
      tool_name: msg.toolName || activeTool,
      query_text: msg.queryText || null,
      response_excerpt: msg.content.slice(0, 300),
      rating,
      reasons,
      comment,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    }).catch(() => {
      // Fire-and-forget: fail silently
    });
  };

  const handleFeedbackUp = (index: number) => {
    if (feedbackRatings[index]) return;

    setFeedbackRatings((prev) => ({ ...prev, [index]: "up" }));
    submitFeedback(index, "up");
  };

  const handleFeedbackDown = (index: number) => {
    if (feedbackRatings[index]) return;

    setFeedbackModalIndex(index);
  };

  const handleFeedbackModalSkip = () => {
    if (feedbackModalIndex === null) return;

    setFeedbackRatings((prev) => ({ ...prev, [feedbackModalIndex]: "down" }));
    submitFeedback(feedbackModalIndex, "down");
    setFeedbackModalIndex(null);
  };

  const handleFeedbackModalSubmit = (reasons: string[], comment: string) => {
    if (feedbackModalIndex === null) return;

    setFeedbackRatings((prev) => ({ ...prev, [feedbackModalIndex]: "down" }));
    submitFeedback(feedbackModalIndex, "down", reasons, comment);
    setFeedbackModalIndex(null);
  };

  return (
    <main className={`min-h-screen transition-colors duration-500 ${!book ? "bg-background-dark" : "bg-background"}`}>
      {!book ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <BookUploader onUploadComplete={handleUploadComplete} />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* Left Panel - 40% Width */}
          <aside className="w-[40%] bg-white border-r border-[--border] flex z-10 overflow-hidden">
            {/* Column 1 - 80% (Book Display) */}
            <div className="w-[80%] h-full p-12 flex flex-col items-center justify-center border-r border-[--border] bg-gradient-to-b from-[#F8F9FA] to-white overflow-hidden relative">
              <div className="w-full max-w-[320px] aspect-[3/4] rounded-3xl border border-[--border] flex items-center justify-center mb-10 relative group overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A73E8]/10 to-transparent z-10" />
                {book.cover_data ? (
                  <img
                    src={`data:image/png;base64,${book.cover_data}`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Book className="h-32 w-32 text-[#1A73E8]/20" />
                    <span className="text-xs font-bold text-[#1A73E8]/30 uppercase tracking-widest">No Cover Available</span>
                  </div>
                )}
              </div>

              <div className="text-center w-full px-6">
                <p className="text-[10px] text-[--text-gray] uppercase tracking-[0.3em] font-black mb-3">
                  {bookType === "fiction" ? "Literary Archive" : "Academic Resource"}
                </p>
                <h2 className="text-3xl font-bold text-[--text-charcoal] mb-3 leading-tight line-clamp-2">{book.title}</h2>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-[#34A853] font-semibold">
                    <div className="h-2 w-2 bg-[#34A853] rounded-full animate-pulse" />
                    Successfully Processed
                  </div>
                  <Button
                    variant="link"
                    className="text-[13.5px] font-bold text-[#1A73E8] p-0 h-auto hover:no-underline hover:text-[#165CB8]"
                    onClick={() => setBook(null)}
                  >
                    Switch Book
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 2 - 20% (Tools Only Icons/Labels) */}
            <div className="w-[20%] h-full p-6 bg-[#F8F9FA]/50 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="mb-8 text-center">
                <h3 className="text-[10px] font-black text-[--text-gray] uppercase tracking-[0.2em] mb-1">Quick</h3>
                <h3 className="text-[10px] font-black text-[--text-gray] uppercase tracking-[0.2em]">Tools</h3>
              </div>
              <ToolSelector
                activeTool={activeTool}
                onToolChange={handleToolChange}
                bookType={bookType}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
                variant="grid"
                isLoading={isLoading}
                isPaidUser={isPaidUser}
                onLockedPaidToolClick={() => setShowUpgradeModal(true)}
              />
            </div>
          </aside>

          {/* Right Panel - 60% Width */}
          <section className="w-[60%] bg-background-dark flex flex-col overflow-hidden">
            <header className="p-10 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">EasyLearn Assistant</h1>
                  <p className="text-[#A1A1AA] text-sm">Artificial Intelligence for Academic Excellence</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-white/60 font-medium">Session ID: {book.id.slice(0, 8)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    disabled={isLoading}
                    className="h-8 gap-1.5 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    New Conversation
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-y-auto px-10 py-8 custom-scrollbar pb-32">
                <ChatWindow
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  toolName={activeTool}
                  hideInput={true}
                  feedbackRatings={feedbackRatings}
                  onFeedbackUp={handleFeedbackUp}
                  onFeedbackDown={handleFeedbackDown}
                />
              </div>
            </div>

            <footer className="p-6 bg-background-dark/80 backdrop-blur-xl border-t border-white/5 mt-auto">
              <div className="max-w-3xl mx-auto">
                {activeTool === "essay_outline" && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs text-white/50 font-medium">Scope:</span>
                    <select
                      value={essayScope}
                      onChange={(e) => setEssayScope(e.target.value)}
                      className="bg-white/5 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-[#1A73E8]"
                    >
                      <option value="entire_book">Entire Book</option>
                      <option value="chapter">Specific Chapter</option>
                    </select>
                  </div>
                )}

                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder={`Ask anything about "${book.title}"...`}
                  value={chatInput}
                  onChange={setChatInput}
                />
              </div>
            </footer>
          </section>
        </div>
      )}

      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <FeedbackModal
        open={feedbackModalIndex !== null}
        onSubmit={handleFeedbackModalSubmit}
        onSkip={handleFeedbackModalSkip}
      />
    </main>
  );
}

function ChatInput({ onSendMessage, isLoading, placeholder, value, onChange }: {
  onSendMessage: (t: string) => void,
  isLoading: boolean,
  placeholder: string,
  value: string,
  onChange: (t: string) => void
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && value.trim() && (onSendMessage(value), onChange(""))}
        placeholder={placeholder}
        className="flex-1 h-14 bg-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 focus:border-[#1A73E8] focus:ring-4 focus:ring-[#1A73E8]/10 transition-all shadow-inner"
        disabled={isLoading}
      />
      <Button
        onClick={() => { onSendMessage(value); onChange(""); }}
        disabled={isLoading || !value.trim()}
        className="h-14 w-14 rounded-2xl bg-[#1A73E8] hover:bg-[#165CB8] shadow-lg shadow-[#1A73E8]/20 flex items-center justify-center p-0 shrink-0"
      >
        <Send className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
