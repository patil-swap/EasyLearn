"use client";

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-[#E8EAED] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#202124] mb-2">Coming soon for paid users</h2>
                    <p className="text-sm text-[#5F6368] leading-relaxed">
                        Essay Outline Generator will be available for Student Pro users. It will help you create
                        structured essay outlines, arguable thesis statements, and verbatim quotes with citations
                        from fiction books.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-[#1A73E8] text-white text-sm font-medium hover:bg-[#165CB8] transition-colors"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
}
