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

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await api.uploadBook(file, bookType, fileFormat);
      onUploadComplete(response.book_id, response.title);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm border-[#E8EAED]">
      <CardHeader>
        <CardTitle className="text-xl text-[#202124]">Upload Your Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file">Book File (.pdf, .epub, .txt)</Label>
          <div 
            className="border-2 border-dashed border-[#E8EAED] rounded-lg p-8 text-center cursor-pointer hover:border-[#1A73E8] transition-colors"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-[#5F6368] mb-2" />
            <p className="text-sm text-[#5F6368]">
              {file ? file.name : "Drag and drop or click to select"}
            </p>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.epub,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Book Type</Label>
            <Select value={bookType} onValueChange={setBookType}>
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
            <Select value={fileFormat} onValueChange={setFileFormat}>
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
          className="w-full bg-[#1A73E8] hover:bg-[#165CB8]" 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Start Learning"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
