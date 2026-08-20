"use client";

import { useEffect, useState } from "react";

interface FeedbackModalProps {
    open: boolean;
    onSubmit: (reasons: string[], comment: string) => void;
    onSkip: () => void;
}

const REASONS = [
    { value: "wrong_information", label: "Wrong information" },
    { value: "missing_context", label: "Missing context" },
    { value: "too_long", label: "Response too long" },
    { value: "too_short", label: "Response too short" },
    { value: "unanswered", label: "Didn't answer my question" },
    { value: "wrong_sources", label: "Cited wrong sources" },
];

export function FeedbackModal({ open, onSubmit, onSkip }: FeedbackModalProps) {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (open) {
            setSelectedReasons([]);
            setComment("");
        }
    }, [open]);

    if (!open) return null;

    const toggleReason = (value: string) => {
        setSelectedReasons((prev) =>
            prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onSkip}
        >
            <div
                className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-[#E8EAED] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-[#202124] mb-1">What went wrong?</h2>
                <p className="text-sm text-[#5F6368] mb-6">
                    Your feedback helps improve EasyLearn. This is optional.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {REASONS.map((reason) => {
                        const selected = selectedReasons.includes(reason.value);

                        return (
                            <button
                                key={reason.value}
                                type="button"
                                onClick={() => toggleReason(reason.value)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selected
                                        ? "bg-[#1A73E8] border-[#1A73E8] text-white"
                                        : "bg-white border-[#E8EAED] text-[#5F6368] hover:border-[#1A73E8]"
                                    }`}
                            >
                                {reason.label}
                            </button>
                        );
                    })}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    placeholder="Anything else? (optional)"
                    className="w-full h-24 resize-none rounded-xl border border-[#E8EAED] px-4 py-3 text-sm text-[#202124] outline-none focus:border-[#1A73E8] focus:ring-4 focus:ring-[#1A73E8]/10 mb-6"
                />

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-[#5F6368] hover:bg-[#F8F9FA] transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        type="button"
                        onClick={() => onSubmit(selectedReasons, comment)}
                        className="px-4 py-2 rounded-lg bg-[#1A73E8] text-white text-sm font-medium hover:bg-[#165CB8] transition-colors"
                    >
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
}
