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
import { Loader2, UploadCloud } from "lucide-react";

interface BookUploaderProps {
  onUploadComplete: (bookId: string, title: string) => void;
}

export function BookUploader({ onUploadComplete }: BookUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bookType, setBookType] = useState<string>("fiction");
  const [fileFormat, setFileFormat] = useState<string>("pdf");
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
    setError(null);
    setIsUploading(true);
    setProgressStage("Uploading file...");

    try {
      const uploadRes = await api.uploadBook(file, bookType, fileFormat);
      const bookId = uploadRes.book_id;

      // Start Polling for Status Staging
      let attempts = 0;
      const pollStatus = async () => {
        try {
          const statusRes = await api.getUploadStatus(bookId);
          
          if (statusRes.status === "completed") {
            setProgressStage("Ready.");
            onUploadComplete(bookId, file.name);
            setIsUploading(false);
            return;
          }

          if (statusRes.status === "failed") {
            setError({ 
              code: statusRes.code || "PROCESSING_ERROR", 
              message: statusRes.message || "An error occurred during processing." 
            });
            setIsUploading(false);
            return;
          }

          // Stage mapping based on attempts for demo (since backend is fast)
          if (attempts < 2) setProgressStage("Validating file...");
          else if (attempts < 5) setProgressStage("Processing book content...");
          else setProgressStage("Building search index...");

          attempts++;
          if (attempts < 100) setTimeout(pollStatus, 2000);
          else {
            setError({ code: "TIMEOUT", message: "Processing timed out. Please try again." });
            setIsUploading(false);
          }
        } catch (e) {
          setError({ code: "POLL_ERROR", message: "Connection lost during processing." });
          setIsUploading(false);
        }
      };

      pollStatus();
    } catch (err: any) {
      setError({ 
        code: err.code || "UPLOAD_FAILED", 
        message: err.message || "Upload failed. Please try again." 
      });
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm border-[#E8EAED]">
      <CardHeader>
        <CardTitle className="text-xl text-[#202124]">Upload Your Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-[#EA4335]/10 border border-[#EA4335] text-[#EA4335] p-3 rounded-lg text-sm font-medium">
            <p className="font-bold">Error: {error.code}</p>
            <p>{error.message}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="file">Book File (.pdf, .epub, .txt)</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? "border-[#1A73E8] bg-[#1A73E8]/5" : "border-[#E8EAED] hover:border-[#1A73E8]"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadCloud className={`mx-auto h-12 w-12 mb-2 ${file ? "text-[#1A73E8]" : "text-[#5F6368]"}`} />
            <p className="text-sm font-medium text-[#202124]">
              {file ? file.name : "Drag and drop or click to select"}
            </p>
            {file && (
              <p className="text-[10px] text-[#5F6368] mt-1">
                Selected: {file.name} — {formatSize(file.size)}
              </p>
            )}
            {!file && <p className="text-xs text-[#5F6368]">Max 50MB</p>}
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.epub,.txt"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Book Type</Label>
            <Select value={bookType} onValueChange={setBookType} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiction">Fiction / Novel</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={fileFormat} onValueChange={setFileFormat} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="epub">EPUB</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          className={`w-full ${isUploading ? "bg-[#5F6368]" : "bg-[#1A73E8] hover:bg-[#165CB8]"}`} 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {progressStage}
            </>
          ) : (
            "Start Learning"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
