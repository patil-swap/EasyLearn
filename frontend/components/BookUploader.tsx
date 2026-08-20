"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UploadCloud, Book, Cpu, Settings, FileText } from "lucide-react";

interface BookUploaderProps {
  onUploadComplete: (
    bookId: string,
    title: string,
    coverData?: string | null,
    bookType?: string
  ) => void;
}

export function BookUploader({ onUploadComplete }: BookUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bookType, setBookType] = useState<string>("");
  const [fileFormat, setFileFormat] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [progressStage, setProgressStage] = useState<string>("");

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setError({ code: "FILE_TOO_LARGE", message: "File too large. Maximum allowed size is 50MB." });
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!bookType) {
      setError({ code: "SELECTION REQUIRED", message: "Please select the book type." });
      return;
    }

    if (!fileFormat) {
      setError({ code: "SELECTION REQUIRED", message: "Please select the file format." });
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgressStage("Uploading...");

    try {
      const uploadRes = await api.uploadBook(file, bookType, fileFormat);
      const bookId = uploadRes.book_id;
      const initialCover = uploadRes.cover_data;

      let attempts = 0;
      const pollStatus = async () => {
        try {
          const statusRes = await api.getUploadStatus(bookId);
          if (statusRes.status === "completed") {
            onUploadComplete(
              bookId,
              file!.name,
              statusRes.cover_data || initialCover,
              bookType
            );
            setIsUploading(false);
            return;
          }
          if (statusRes.status === "failed") {
            setError({ code: statusRes.code || "ERR", message: statusRes.message || "Failed" });
            setIsUploading(false);
            return;
          }
          if (attempts < 2) setProgressStage("Validating...");
          else if (attempts < 5) setProgressStage("Extracting...");
          else setProgressStage("Vectorizing...");
          attempts++;
          if (attempts < 100) setTimeout(pollStatus, 1500);
          else {
            setError({ code: "TIMEOUT", message: "Timed out" });
            setIsUploading(false);
          }
        } catch (e) {
          setError({ code: "CONN", message: "Lost connection" });
          setIsUploading(false);
        }
      };
      pollStatus();
    } catch (err: any) {
      setError({ code: "FAIL", message: err.message });
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4 animate-in fade-in duration-700">
      {/* Hero Illustration */}
      <div className="relative mb-8">
        <div className="bg-[#1A73E8]/10 p-6 rounded-full inline-block relative border border-[#1A73E8]/20 shadow-[0_0_50px_rgba(26,115,232,0.1)]">
          <Book className="h-24 w-24 text-[#1A73E8]" />
          <div className="absolute top-0 right-0 bg-[#FFFFFF] p-2 rounded-full shadow-lg border border-[#E8EAED] translate-x-1/4 -translate-y-1/4">
            <Cpu className="h-8 w-8 text-[#1A73E8] animate-pulse" />
          </div>
          <div className="absolute bottom-0 left-0 bg-[#FFFFFF] p-1.5 rounded-full shadow-md border border-[#E8EAED] -translate-x-1/4 translate-y-1/4">
            <Settings className="h-6 w-6 text-[#5F6368] animate-spin-[10s_linear_infinite]" />
          </div>
        </div>
      </div>

      <h1 className="text-[36px] font-bold text-white mb-2 tracking-tight">
        Welcome to EasyLearn
      </h1>

      <p className="text-[#A1A1AA] text-sm mb-10 max-w-sm mx-auto leading-relaxed">
        Your intelligent companion for deep book analysis and learning.
      </p>

      {error && (
        <div className="mb-6 bg-[#EA4335]/15 border border-[#EA4335] text-white p-4 rounded-xl text-sm max-w-sm">
          <p className="font-bold flex items-center justify-center gap-2 mb-1">
            <div className="h-2 w-2 bg-[#EA4335] rounded-full animate-pulse" />
            {error.code}
          </p>
          <p className="text-[#FDA4AF]">{error.message}</p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-4">
        {!file ? (
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={() => document.getElementById("file-input")?.click()}
              className="bg-[#1A73E8] hover:bg-[#165CB8] text-white px-10 h-14 rounded-full font-bold shadow-xl shadow-[#1A73E8]/20 transition-all hover:scale-105 active:scale-95"
            >
              Upload Your Book
            </Button>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.epub,.txt"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#E8EAED] text-left animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#1A73E8]/10 rounded-xl">
                <FileText className="h-6 w-6 text-[#1A73E8]" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[#202124] font-bold truncate">{file.name}</p>
                <p className="text-xs text-[#5F6368]">{formatSize(file.size)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-[#5F6368] font-bold">Type</Label>
                <Select
                  value={bookType || "__placeholder__"}
                  onValueChange={(val) => setBookType(val === "__placeholder__" ? "" : val)}
                  disabled={isUploading}
                >
                  <SelectTrigger className="h-9 text-xs border-[#E8EAED] text-[#202124]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__" disabled>
                      Select type
                    </SelectItem>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-[#5F6368] font-bold">Format</Label>
                <Select
                  value={fileFormat || "__placeholder__"}
                  onValueChange={(val) => setFileFormat(val === "__placeholder__" ? "" : val)}
                  disabled={isUploading}
                >
                  <SelectTrigger className="h-9 text-xs border-[#E8EAED] text-[#202124]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__" disabled>
                      Select format
                    </SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="epub">EPUB</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className={`w-full h-11 rounded-xl font-bold shadow-lg shadow-[#1A73E8]/20 transition-all ${isUploading
                ? "bg-[#F1F3F4] text-[#5F6368]"
                : "bg-[#1A73E8] hover:bg-[#165CB8] text-white"
                }`}
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="animate-pulse">{progressStage}</span>
                </div>
              ) : (
                "Upload Your Book"
              )}
            </Button>

            {!isUploading && (
              <button
                className="w-full text-center mt-4 text-xs text-[#5F6368] hover:text-[#202124] transition-colors"
                onClick={() => setFile(null)}
              >
                Change file
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-[#5F6368] font-medium">
        Supported formats: PDF, EPUB, TXT · One book at a time
      </p>
    </div>
  );
}
