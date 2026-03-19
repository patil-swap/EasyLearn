"use client";

import { Button } from "@/components/ui/button";
import { 
  FileText, 
  HelpCircle, 
  Users, 
  Layout, 
  Lightbulb, 
  Wrench 
} from "lucide-react";

interface ToolSelectorProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  bookType: string;
}

export function ToolSelector({ activeTool, onToolChange, bookType }: ToolSelectorProps) {
  const tools = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "question", label: "Question", icon: HelpCircle },
    { id: "character_arc", label: "Character Arc", icon: Users, fictionOnly: true },
    { id: "plot", label: "Plot", icon: Layout },
    { id: "concept", label: "Concept", icon: Lightbulb, educationalOnly: true },
    { id: "problem", label: "Problem", icon: Wrench, educationalOnly: true },
  ];

  const filteredTools = tools.filter(tool => {
    if (tool.fictionOnly && bookType !== "fiction") return false;
    if (tool.educationalOnly && bookType !== "educational") return false;
    return true;
  });

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filteredTools.map((tool) => (
        <Button
          key={tool.id}
          variant={activeTool === tool.id ? "default" : "outline"}
          className={`flex items-center gap-2 ${
            activeTool === tool.id 
              ? "bg-[#1A73E8] hover:bg-[#165CB8]" 
              : "border-[#E8EAED] text-[#5F6368] hover:bg-[#F8F9FA]"
          }`}
          onClick={() => onToolChange(tool.id)}
        >
          <tool.icon className="h-4 w-4" />
          {tool.label}
        </Button>
      ))}
    </div>
  );
}
