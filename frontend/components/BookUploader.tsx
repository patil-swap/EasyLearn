"use client";

import { useRef } from "react";
import { Loader2 } from "lucide-react";

interface BookUploaderProps {
  bookType: string;
  setBookType: (val: string) => void;
  fileFormat: string;
  setFileFormat: (val: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  progressStage: string;
  variant?: "full" | "compact";
  selectedFile?: File | null;
  onUploadStart?: () => void;
  onCancel?: () => void;
}

export function BookUploader({
  bookType,
  setBookType,
  fileFormat,
  setFileFormat,
  onFileChange,
  isUploading,
  progressStage,
  variant = "full",
  selectedFile = null,
  onUploadStart,
  onCancel
}: BookUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        className="hidden"
        accept=".pdf,.epub,.txt"
        ref={fileInputRef}
        onChange={onFileChange}
      />

      {variant === "compact" ? (
        <div
          className="p-12 text-center cursor-pointer flex flex-col items-center gap-3 bg-muted hover:opacity-80 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-[12px] block mb-2">→</span>
          <span className="text-[13px] font-medium border-b border-transparent hover:border-text-main pb-0.5 transition-colors">Upload New Book</span>
          <span className="text-[11px] text-text-mut">EPUB or PDF</span>
        </div>
      ) : (
        <div
          className={`w-full max-w-[640px] bg-card md:bg-card border ${selectedFile && !isUploading ? 'border-none p-0' : 'border-dashed border-border p-10 md:p-20'} flex flex-col items-center text-center transition-colors hover:border-accent rounded-[2px] md:rounded-none`}
          onClick={() => { if (!selectedFile && !isUploading) fileInputRef.current?.click(); }}
          style={{ cursor: (!selectedFile && !isUploading) ? 'pointer' : 'default' }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-text-mut animate-spin mb-4" />
              <h2 className="text-[16px] font-medium mb-2">{progressStage}</h2>
              <p className="text-[13px] text-text-mut">Please wait while we process the document...</p>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center w-full max-w-[340px]">
              <div className="mb-4 w-12 h-12 bg-pill-bg border border-border rounded-full flex items-center justify-center text-text-main">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h2 className="text-[14px] md:text-[16px] font-medium mb-1 truncate w-full px-4">{selectedFile.name}</h2>
              <p className="text-[11px] md:text-[13px] text-text-mut mb-6">Confirm upload details to begin</p>

              <div className="w-full bg-background border border-border p-5 mb-8 rounded flex flex-col gap-5 text-left">
                <div>
                  <span className="text-[11px] text-text-mut block mb-1 uppercase tracking-wider">Book Type</span>
                  <select
                    className="w-full bg-transparent text-[13px] font-medium text-text-main border-b border-border outline-none pb-1"
                    value={bookType}
                    onChange={e => setBookType(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="fiction" className="bg-background text-text-main border-none">Fiction</option>
                    <option value="educational" className="bg-background text-text-main border-none">Educational</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-text-mut block mb-1 uppercase tracking-wider">Format</span>
                  <select
                    className="w-full bg-transparent text-[13px] font-medium text-text-main border-b border-border outline-none pb-1"
                    value={fileFormat}
                    onChange={e => setFileFormat(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="epub" className="bg-background text-text-main border-none">EPUB</option>
                    <option value="pdf" className="bg-background text-text-main border-none">PDF</option>
                    <option value="txt" className="bg-background text-text-main border-none">TXT</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  className="flex-1 py-2.5 px-4 bg-pill-bg text-text-main border border-border font-medium text-[13px] rounded-full hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a] transition-colors"
                  onClick={(e) => { e.stopPropagation(); onCancel?.(); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 px-4 bg-text-main text-background font-medium text-[13px] rounded-full hover:opacity-80 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onUploadStart?.(); }}
                >
                  Start Processing
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:block mb-6 text-text-main">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 10V30M10 20H30" stroke="currentColor" strokeWidth="1" />
                  <rect x="0.5" y="0.5" width="39" height="39" className="stroke-border" />
                </svg>
              </div>
              <h2 className="text-[14px] md:text-[16px] font-medium mb-1 md:mb-2">Upload New Book</h2>
              <p className="text-[11px] md:text-[13px] text-text-mut mb-0 bg-transparent">Supports EPUB, PDF, TXT <span className="mx-1">|</span> Max size: 50MB</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
