"use client";

import { useState, useRef, useEffect } from "react";
import { api, SourceMetadata } from "@/lib/api";
import { BookUploader } from "@/components/BookUploader";
import { ToolSelector } from "@/components/ToolSelector";
import { ChatWindow } from "@/components/ChatWindow";

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
      <div className="md:max-w-[1440px] md:w-full md:h-screen md:border-l md:border-r md:border-border flex flex-col bg-background shadow-none relative overflow-hidden">

        {/* Header */}
        <header className="p-5 md:py-8 md:px-6 border-b border-border bg-background flex justify-between md:grid md:grid-cols-4 md:items-start items-center z-10 sticky top-0 md:static">
          <div className="flex px-1 items-center gap-2 font-medium text-[16px] md:text-[16px] md:col-start-1 md:col-end-2 tracking-tight">
            <span className="md:hidden">easylearn</span>
          </div>

          <div className="hidden md:block col-start-2 col-end-3 text-[24px] leading-[1.1] tracking-[-0.5px]">
            <span className="text-text-mut text-[14px] block mb-0">easylearn</span>
            Intelligence
          </div>

          <div className="hidden md:flex col-start-3 col-end-5 gap-4 items-start text-[13px] text-text-mut">
            <div>Our RAG framework is a fusion of lexical search and modern LLM tech, redefining deep reading with pinpoint extraction and analysis.</div>
          </div>

          {/* Mobile Active Book Pill */}
          {book && (
            <div className="md:hidden flex items-center gap-2 bg-pill-bg px-3 py-1.5 rounded-full border border-border max-w-[200px]">
              <span className="text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{book.title}</span>
            </div>
          )}

          {/* Mobile Menu Icon */}
          {!book && (
            <div className="md:hidden cursor-pointer">
              <svg width="20" height="6" viewBox="0 0 24 8" fill="none">
                <rect width="24" height="1.5" fill="#111"></rect>
                <rect y="6" width="24" height="1.5" fill="#111"></rect>
              </svg>
            </div>
          )}
        </header>

        {/* Toolbar (Desktop Only OR Mobile Tabs) */}
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
          <section className="col-span-3 flex flex-col flex-1 overflow-hidden">

            {(!book || isUploading || selectedFile) ? (
              /* Empty State Content */
              <div className="flex-1 flex flex-col md:items-center md:justify-center p-5 md:p-16 bg-muted md:bg-secondary overflow-y-auto">

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

                {/* Mobile Only Current Library */}
                <div className="md:hidden border-t border-border mt-8 pt-6 w-full">
                  <span className="text-[11px] text-text-mut uppercase tracking-wider font-medium mb-4 block">Current Library</span>
                  <span className="text-[14px] font-medium block mb-3">No active document</span>
                  <p className="text-[13px] text-text-mut leading-[1.5]">
                    Upload a document to begin analysis. Vector embeddings active for cross-reference.
                  </p>
                </div>

                {/* Mobile Input Stub when no document active */}
                <div className="md:hidden mt-auto pt-4 bg-background self-stretch mx-[-20px] px-5 border-t border-border">
                  <div className="bg-secondary px-4 py-3 rounded-full text-muted-foreground text-[13px]">
                    Tap to start analysis...
                  </div>
                </div>

              </div>
            ) : (
              /* Active State Content (Chat View) */
              <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  onSendMessage={handleSendMessage}
                  messagesEndRef={messagesEndRef}
                >
                  <ToolSelector
                    toolsList={toolsList}
                    activeTool={activeTool}
                    onToolClick={handleToolClick}
                    isLoading={isLoading}
                    book={book}
                    variant="mobile_tabs"
                  />
                </ChatWindow>
              </div>
            )}
          </section>
        </main>
      </div>

    </div>
  );
}
