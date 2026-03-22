"use client";

import { useState, useRef, useEffect } from "react";
import { api, SourceMetadata } from "@/lib/api";
import { BookUploader } from "@/components/BookUploader";
import { ToolSelector } from "@/components/ToolSelector";
import { ChatWindow } from "@/components/ChatWindow";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceMetadata[];
}

export default function Home() {
  const [book, setBook] = useState<{ id: string; title: string; cover_data?: string | null } | null>(null);
  const [bookType, setBookType] = useState<string>("fiction");
  const [fileFormat, setFileFormat] = useState<string>("epub");
  const [activeTool, setActiveTool] = useState("Summary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [progressStage, setProgressStage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      console.error("Maximum allowed size is 50MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadStart = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgressStage("Uploading...");

    try {
      const uploadRes = await api.uploadBook(selectedFile, bookType, fileFormat);
      const bookId = uploadRes.book_id;
      const initialCover = uploadRes.cover_data;

      let attempts = 0;
      const pollStatus = async () => {
        try {
          const statusRes = await api.getUploadStatus(bookId);
          if (statusRes.status === "completed") {
            setBook({ id: bookId, title: selectedFile.name, cover_data: statusRes.cover_data || initialCover });
            setMessages([]);
            setIsUploading(false);
            setSelectedFile(null);
            return;
          }
          if (statusRes.status === "failed") {
            console.error(statusRes.message || "Failed");
            setIsUploading(false);
            return;
          }
          if (attempts < 2) setProgressStage("Validating...");
          else if (attempts < 5) setProgressStage("Extracting...");
          else setProgressStage("Vectorizing...");
          attempts++;
          if (attempts < 100) setTimeout(pollStatus, 1500);
          else {
            console.error("Timed out");
            setIsUploading(false);
          }
        } catch {
          console.error("Lost connection");
          setIsUploading(false);
        }
      };
      pollStatus();
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (text: string, overrideTool?: string) => {
    if (!book || !text.trim()) return;
    setIsLoading(true);

    const userMessage = text.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const toolToUse = overrideTool || activeTool;
    await api.streamQuery(
      book.id,
      toolToUse.toLowerCase().replace(" ", "_"), // simple mapping
      userMessage,
      "standard",
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
      }
    );
  };

  const toolsList = [
    { id: "Summary", label: "Summary", disabled: false },
    { id: "Question", label: "Question", disabled: false },
    { id: "Character Arc", label: "Character Arc", disabled: bookType !== "fiction" },
    { id: "Plot", label: "Plot", disabled: false },
    { id: "Concept", label: "Concept", disabled: bookType !== "educational" },
    { id: "Problem", label: "Problem", disabled: bookType !== "educational" },
  ];

  const handleToolClick = (t: string) => {
    setActiveTool(t);
    const prefixes: Record<string, string> = {
      "Summary": "Summarize this book.",
      "Character Arc": "Analyze the character arc of: ",
      "Plot": "Explain the plot points regarding: ",
      "Concept": "Explain the concept of: ",
      "Problem": "How can I solve the problem of: ",
      "Question": ""
    };
    if (t === "Summary") {
      setChatInput("");
      handleSendMessage("Summarize this book.", t);
    } else {
      setChatInput(prefixes[t] || "");
    }
  };

  return (
    <div className="font-sans antialiased text-text-main min-h-screen md:bg-background md:flex md:justify-center md:items-center">

      {/* Container simulating the desktop or mobile frame */}
      <div className="md:max-w-[1440px] md:w-full h-[100dvh] md:h-screen md:border-l md:border-r md:border-border flex flex-col bg-background shadow-none relative overflow-hidden">

        {/* Header */}
        <header className="p-5 md:py-8 md:px-6 border-b border-border bg-background flex justify-between md:grid md:grid-cols-4 md:items-start items-center z-20 sticky top-0 md:static">
          <div className="flex px-1 items-center gap-2 font-medium text-[16px] md:text-[16px] md:col-start-1 md:col-end-2 tracking-tight">
            <span className="md:hidden text-[14px]">
              <span className="text-text-mut font-normal">easylearn</span> Intelligence
            </span>
          </div>

          <div className="hidden md:block col-start-2 col-end-3 text-[24px] leading-[1.1] tracking-[-0.5px]">
            <span className="text-text-mut text-[14px] block mb-0">easylearn</span>
            Intelligence
          </div>

          <div className="hidden md:flex col-start-3 col-end-5 gap-4 items-start text-[13px] text-text-mut">
            <div>Our RAG framework is a fusion of lexical search and modern LLM tech, redefining deep reading with pinpoint extraction and analysis.</div>
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden cursor-pointer p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="14" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="2" x2="21" y2="2"></line>
                <line x1="3" y1="7" x2="21" y2="7"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
              </svg>
            )}
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[60px] left-0 w-full bg-background border-b border-border z-10 p-5 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        )}

        {/* Toolbar (Desktop Only) */}
        <div className="hidden md:block">
          {(!book || isUploading || selectedFile) ? (
            <ToolSelector
              toolsList={toolsList}
              activeTool={activeTool}
              onToolClick={handleToolClick}
              isLoading={isLoading || isUploading}
              book={book}
              variant="empty_state"
            />
          ) : (
            <ToolSelector
              toolsList={toolsList}
              activeTool={activeTool}
              onToolClick={handleToolClick}
              isLoading={isLoading}
              book={book}
              variant="desktop"
            />
          )}
        </div>

        {/* Main Workspace */}
        <main className={`flex-1 flex flex-col md:grid md:grid-cols-4 overflow-hidden`}>

          {/* Sidebar (Desktop Only) */}
          <aside className="hidden md:flex col-start-1 col-end-2 border-r border-border flex-col min-h-0">
            {(!book || isUploading || selectedFile) ? (
              <>
                <div className="p-6 border-b border-border">
                  <span className="text-[11px] text-text-mut block mb-1">Status: Waiting</span>
                  <h2 className="text-[13px] font-medium m-0">No active document</h2>
                </div>
                <div className="p-6 flex-1">
                  <p className="text-[13px] text-text-mut leading-[1.6] m-0">
                    Upload a document to begin analysis. Our system supports high-density text extraction for complex narrative and technical structures.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b border-border">
                  <span className="text-[11px] text-text-mut block mb-1">Status: Active</span>
                  <h2 className="text-[13px] font-medium m-0 truncate break-all">{book.title}</h2>
                </div>
                <div className="p-6 flex-1 border-b border-border flex flex-col items-center">
                  {book.cover_data ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.cover_data.startsWith('http') || book.cover_data.startsWith('data:') ? book.cover_data : `data:image/jpeg;base64,${book.cover_data}`}
                      alt="Cover"
                      className="max-w-[180px] w-full object-contain rounded drop-shadow-md mb-6"
                    />
                  ) : (
                    <p className="text-[13px] text-text-mut leading-[1.6] mb-6">
                      Document indexed successfully. Vector embeddings generated for character tracking and conceptual mapping.
                    </p>
                  )}
                </div>
                <BookUploader
                  bookType={bookType}
                  setBookType={setBookType}
                  fileFormat={fileFormat}
                  setFileFormat={setFileFormat}
                  onFileChange={handleFileChange}
                  isUploading={isUploading}
                  progressStage={progressStage}
                  variant="compact"
                />
              </>
            )}
          </aside>

          {/* Main Content Area */}
          <section className="col-span-3 flex flex-col flex-1 overflow-hidden min-h-0">

            {(!book || isUploading || selectedFile) ? (
              /* Empty State Content */
              <div className="flex-1 flex flex-col bg-muted md:bg-secondary overflow-hidden">
                <div className="flex-1 flex flex-col md:items-center md:justify-center p-5 md:p-16 overflow-y-auto">

                {/* Mobile Only Source Document Text */}
                <span className="md:hidden text-[11px] text-text-mut uppercase tracking-wider font-medium mb-4 block">Source Document</span>

                <BookUploader
                  bookType={bookType}
                  setBookType={setBookType}
                  fileFormat={fileFormat}
                  setFileFormat={setFileFormat}
                  onFileChange={handleFileChange}
                  isUploading={isUploading}
                  progressStage={progressStage}
                  variant="full"
                  selectedFile={selectedFile}
                  onUploadStart={handleUploadStart}
                  onCancel={() => setSelectedFile(null)}
                />

                {/* Mobile Only Analysis Tools */}
                <div className="md:hidden mt-8 w-full">
                  <span className="text-[11px] text-text-mut uppercase tracking-wider font-medium mb-1 block">Analysis Tools</span>
                  <div className="opacity-40 pointer-events-none grayscale">
                    <ToolSelector
                      toolsList={toolsList}
                      activeTool={activeTool}
                      onToolClick={handleToolClick}
                      isLoading={true}
                      book={book}
                      variant="mobile_tabs"
                    />
                  </div>
                </div>

                {/* Mobile Only Current Library */}
                <div className="md:hidden border-t border-border mt-8 pt-6 w-full">
                  <span className="text-[11px] text-text-mut uppercase tracking-wider font-medium mb-4 block">Current Library</span>
                  <span className="text-[14px] font-medium block mb-3">No active document</span>
                  <p className="text-[13px] text-text-mut leading-[1.5]">
                    Upload a document to begin analysis. Vector embeddings active for cross-reference.
                  </p>
                </div>

                </div>

                {/* Mobile Input Stub when no document active */}
                <div className="md:hidden pt-4 pb-6 bg-background px-5 border-t border-border shrink-0 w-full">
                  <div className="bg-[#f9f9f9] dark:bg-[#111] px-4 py-3 rounded-[24px] text-[#cccccc] dark:text-[#555] text-[13px] border border-[#f0f0f0] dark:border-[#333]">
                    {isUploading ? "Analysis unavailable during upload..." : "Upload a book to begin"}
                  </div>
                </div>

              </div>
            ) : (
              /* Active State Content (Chat View) */
              <div className="flex-1 flex flex-col bg-background overflow-hidden relative min-h-0">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  onSendMessage={handleSendMessage}
                  messagesEndRef={messagesEndRef}
                >
                  <div className="md:hidden flex flex-col gap-6 w-full mb-2">
                    {/* Active Source */}
                    <div>
                      <span className="text-[10px] uppercase text-text-mut font-semibold tracking-[0.08em] block mb-3">Active Source</span>
                      <div className="bg-[#fafafa] dark:bg-[#111] border border-border p-4 rounded-xl flex flex-col">
                        <div className="flex flex-col gap-1">
                          <span className="text-[14px] font-semibold text-text-main">{book.title}</span>
                          <span className="text-[11px] text-text-mut">Ready for analysis</span>
                        </div>
                        <button 
                          onClick={() => { setBook(null); setMessages([]); setIsUploading(false); }}
                          className="mt-3 text-[11px] text-accent font-medium flex items-center gap-1 self-start hover:opacity-80"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                          </svg>
                          Change
                        </button>
                      </div>
                    </div>
                    {/* Analysis Tools */}
                    <div>
                      <span className="text-[10px] uppercase text-text-mut font-semibold tracking-[0.08em] block mb-3">Analysis Tools</span>
                      <ToolSelector
                        toolsList={toolsList}
                        activeTool={activeTool}
                        onToolClick={handleToolClick}
                        isLoading={isLoading}
                        book={book}
                        variant="mobile_tabs"
                      />
                    </div>
                  </div>
                </ChatWindow>
              </div>
            )}
          </section>
        </main>
      </div>

    </div>
  );
}
