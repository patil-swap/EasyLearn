"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackControlsProps {
    rating: "up" | "down" | null;
    isLast: boolean;
    onUp: () => void;
    onDown: () => void;
}

export function FeedbackControls({ rating, isLast, onUp, onDown }: FeedbackControlsProps) {
    return (
        <div className={`mt-4 ${isLast ? "opacity-100" : "opacity-60 hover:opacity-100 transition-opacity"}`}>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onUp}
                    aria-label="Thumbs up"
                    className={`p-1.5 rounded-lg border transition-colors ${rating === "up"
                        ? "text-[#1A73E8] border-[#1A73E8] bg-[#1A73E8]/10"
                        : rating === "down"
                            ? "text-white/40 border-white/10"
                            : "text-white/60 border-white/10 hover:text-[#1A73E8] hover:border-[#1A73E8]"
                        }`}
                >
                    <ThumbsUp className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    onClick={onDown}
                    aria-label="Thumbs down"
                    className={`p-1.5 rounded-lg border transition-colors ${rating === "down"
                        ? "text-[#EA4335] border-[#EA4335] bg-[#EA4335]/10"
                        : rating === "up"
                            ? "text-white/40 border-white/10"
                            : "text-white/60 border-white/10 hover:text-[#EA4335] hover:border-[#EA4335]"
                        }`}
                >
                    <ThumbsDown className="h-4 w-4" />
                </button>
            </div>

            <p className="text-[12px] text-[#5F6368] mt-2">
                Feedback is stored locally and used only to improve EasyLearn.
            </p>
        </div>
    );
}
