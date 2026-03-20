"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  HelpCircle,
  Users,
  Layout,
  Lightbulb,
  Wrench,
  ArrowRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface ToolSelectorProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  bookType: string;
  difficulty: string;
  onDifficultyChange: (val: string) => void;
  variant?: "list" | "grid";
  isLoading?: boolean;
}

export function ToolSelector({ activeTool, onToolChange, bookType, difficulty, onDifficultyChange, variant = "list", isLoading = false }: ToolSelectorProps) {
  const tools = [
    { id: "summary", label: "Summary", icon: FileText, actionLabel: "Summarize" },
    { id: "question", label: "QA", icon: HelpCircle, actionLabel: "Ask" },
    { id: "character_arc", label: "Characters", icon: Users, fictionOnly: true, actionLabel: "Analyze" },
    { id: "plot", label: "Plot", icon: Layout, actionLabel: "Explain" },
    { id: "concept", label: "Concepts", icon: Lightbulb, educationalOnly: true, actionLabel: "Teach" },
    { id: "problem", label: "Problems", icon: Wrench, educationalOnly: true, actionLabel: "Solve" },
  ];

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-1 gap-3 w-full">
        {tools.map((tool) => {
          const isApplicable = !(
            (tool.fictionOnly && bookType !== "fiction") ||
            (tool.educationalOnly && bookType !== "educational")
          );
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              disabled={!isApplicable || isLoading}
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? "bg-[#1A73E8] border-[#1A73E8] text-white shadow-lg shadow-[#1A73E8]/20 scale-[1.02]"
                  : "bg-white border-[--border] text-[--text-charcoal] hover:border-[#1A73E8]/30 hover:bg-[#F8F9FA]"
              } ${(!isApplicable || isLoading) ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"}`}
            >
              <tool.icon className={`h-5 w-5 mb-2 ${isActive ? "text-white" : "text-[#1A73E8]"}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-center leading-none">{tool.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Original list variant (for reference or other pages)
  return (
    <div className="space-y-4 max-w-4xl">
      {tools.map((tool, index) => {
        const isApplicable = !(
          (tool.fictionOnly && bookType !== "fiction") ||
          (tool.educationalOnly && bookType !== "educational")
        );
        const isActive = activeTool === tool.id;

        return (
          <div
            key={tool.id}
            className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${isActive
              ? "border-[#1A73E8] shadow-[0_0_25px_rgba(26,115,232,0.15)] ring-1 ring-[#1A73E8]"
              : "border-white/10 hover:border-white/20 shadow-sm"
              } ${!isApplicable ? "opacity-30 grayscale-[0.8]" : ""}`}
          >
            <div className="flex items-start gap-6">
              <div className="text-sm font-black text-white/20 mt-1 w-4">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-[#1A73E8] text-white" : "bg-white/5 text-white/70"}`}>
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{tool.label}</h3>
                  {!isApplicable && (
                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Not Applicable
                    </span>
                  )}
                </div>
                {/* Description removed as per new tools array structure */}
                {/* Input and Difficulty Select removed as per new tools array structure */}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <Button
                  variant="outline"
                  disabled={!isApplicable}
                  onClick={() => onToolChange(tool.id)}
                  className={`h-11 px-6 rounded-xl font-bold transition-all ${isActive
                    ? "border-[#1A73E8] text-[#1A73E8] bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20"
                    : "border-white/20 text-white bg-transparent hover:bg-white/10 hover:border-white"
                    }`}
                >
                  {tool.actionLabel}
                  <ArrowRight className={`ml-2 h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
