import { ThemeToggle } from "./ThemeToggle";

interface ToolSelectorProps {
  toolsList: Array<{ id: string; label: string; disabled: boolean }>;
  activeTool: string;
  onToolClick: (id: string) => void;
  isLoading: boolean;
  book: { id: string; title: string; cover_data?: string | null } | null;
  variant?: "desktop" | "mobile_tabs" | "empty_state";
}

export function ToolSelector({ toolsList, activeTool, onToolClick, isLoading, book, variant = "desktop" }: ToolSelectorProps) {
  if (variant === "empty_state") {
    return (
      <section className="p-5 md:p-6 border-b border-border flex flex-col gap-3">
        <div className="flex justify-between items-center w-full mb-2 md:mb-0">
          <div className="text-[11px] md:text-[13px] text-text-mut md:text-text-main tracking-wider md:tracking-normal font-medium md:font-normal block">
            <span className="md:hidden">Analysis Tools</span>
            <span className="hidden md:block">Active Tool</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2.5 md:gap-2 md:opacity-40 md:pointer-events-none">
          {toolsList.map(t => (
            <button key={t.id} disabled={t.disabled || isLoading} onClick={(e) => { e.stopPropagation(); if (book) onToolClick(t.id); }} className={`bg-pill-bg text-text-main border-none rounded-[4px] md:rounded-full px-3 py-3 md:px-[14px] md:py-[6px] text-[12px] md:text-[11px] flex items-center gap-2 text-left md:text-center ${activeTool === t.id ? "md:bg-accent md:text-white" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTool === t.id ? "md:bg-text-main bg-[#ccc]" : "bg-[#999] md:opacity-100"}`}></span>{t.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "mobile_tabs") {
    return (
      <div className="md:hidden flex gap-2 py-3 px-5 overflow-x-auto border-t border-border bg-background" style={{ scrollbarWidth: 'none' }}>
        {toolsList.map(t => (
          <button
            key={t.id}
            onClick={() => onToolClick(t.id)}
            disabled={t.disabled || isLoading}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-[12px] border ${t.disabled || isLoading ? 'opacity-30 cursor-not-allowed' : ''} ${activeTool === t.id ? 'bg-accent text-white border-accent' : 'bg-pill-bg text-text-mut border-border'}`}>
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:flex p-6 border-b border-border flex-col gap-3">
      <div className="flex items-center justify-between w-full">
        <div className="text-[13px] text-text-main">Active Tool</div>
        <ThemeToggle />
      </div>
      <div className="flex flex-wrap gap-2">
        {toolsList.map(t => (
          <button
            key={t.id}
            onClick={() => onToolClick(t.id)}
            disabled={t.disabled || isLoading}
            className={`border-none rounded-full px-[14px] py-[6px] text-[11px] flex items-center gap-2 transition-all duration-200 ${t.disabled || isLoading ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${activeTool === t.id ? 'bg-accent text-white' : 'bg-pill-bg text-text-main hover:bg-[#e5e5e5]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeTool === t.id ? 'bg-white text-main' : 'bg-[#999]'}`}></span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
