import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { Message } from "@/app/page";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}

export function ChatWindow({ messages, isLoading, chatInput, setChatInput, onSendMessage, messagesEndRef, children }: ChatWindowProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto min-h-0 p-5 md:p-8 flex flex-col gap-6 md:gap-0">
        {/* Render children (like Active Source and Tools Grid) at the top of scroll view on mobile */}
        <div className="md:hidden">
          {children}
        </div>
        
        {messages.length === 0 && (
          <div className="md:hidden max-w-[90%] text-[14px] leading-[1.5] self-start text-text-main">
            <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400 font-semibold mb-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ANALYSIS READY
            </div>
            <p>Hello. I&apos;ve mapped the full context of the document. What aspect should we explore first?</p>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'assistant') {
            return (
              <div key={i} className="flex flex-col md:grid md:grid-cols-3 md:py-8 md:border-b md:border-border self-start md:self-auto w-full">
                <div className="md:col-start-1 md:col-end-2 md:pr-6 hidden md:block">
                  <span className="text-[11px] text-text-mut uppercase block mb-1">Response</span>
                  <h3 className="text-[13px] font-medium m-0 text-text-main">Analysis Generated</h3>
                </div>
                <div className="md:col-start-2 md:col-end-4 max-w-[90%] md:max-w-none text-text-main text-[14px] md:text-[13px] leading-[1.5] md:leading-[1.6]">
                  <div className="md:hidden bg-pill-bg border border-border rounded-xl p-4 mt-3">
                    <h4 className="text-[12px] font-semibold mb-2 text-accent uppercase tracking-wider">Analysis</h4>
                    <div className="text-[14px] text-text-mut md:text-text-main leading-[1.5]">
                      {m.content ? (
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      ) : isLoading && i === messages.length - 1 ? (
                        <div className="flex items-center gap-2 text-text-mut"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden md:block text-[13px] text-text-mut">
                    {m.content ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : isLoading && i === messages.length - 1 ? (
                      <div className="flex items-center gap-2 text-text-mut"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          } else {
            return (
              <div key={i} className="flex flex-col md:grid md:grid-cols-3 md:py-8 md:border-b md:border-border self-end md:self-auto w-full mt-4 md:mt-0">
                <div className="md:col-start-1 md:col-end-2 md:pr-6 hidden md:block">
                  <span className="text-[11px] text-text-mut uppercase block mb-1">Query</span>
                  <h3 className="text-[13px] font-medium m-0">Analysis Request</h3>
                </div>
                {/* Mobile User Message Bubble Style */}
                <div className="md:hidden max-w-[88%] text-[13px] leading-[1.5] self-end bg-[#f4f4f4] dark:bg-[#222] text-text-main p-[12px_16px] rounded-[16px_16px_4px_16px] border border-border">
                  {m.content}
                </div>
                {/* Desktop User Message Style */}
                <div className="hidden md:block md:col-start-2 md:col-end-4 md:max-w-none md:text-text-main md:text-[18px] leading-[1.4] tracking-[-0.3px]">
                  {m.content}
                </div>
              </div>
            )
          }
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="hidden md:block">
        {children}
      </div>

      <div className="shrink-0 md:border-t md:border-border md:bg-background p-4 px-5 md:p-6 pb-8 md:pb-6 bg-background sticky bottom-0 z-10 w-full">
        <div className="flex items-center gap-3 bg-secondary md:bg-transparent rounded-[24px] md:rounded-none p-2 md:p-0 pl-4 md:pl-0">
          <input
            type="text"
            className="flex-1 border-none bg-transparent outline-none font-sans text-[14px] md:text-[14px] text-text-main placeholder:text-muted-foreground md:py-2 w-full"
            placeholder="Ask a follow-up question or request another analysis..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage(chatInput)}
            disabled={isLoading}
          />
          <button
            className="md:hidden w-8 h-8 rounded-full bg-primary flex justify-center items-center shrink-0 cursor-pointer text-primary-foreground"
            onClick={() => onSendMessage(chatInput)}
            disabled={isLoading || !chatInput.trim()}
          >
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] fill-current">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}