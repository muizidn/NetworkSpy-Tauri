import React, { useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isTyping: boolean;
    hasApiKey: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
    input, 
    setInput, 
    onSend, 
    isTyping, 
    hasApiKey 
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    if (!hasApiKey) {
        return (
            <div className="p-4 bg-[#0a0a0c] border-t border-zinc-900">
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
                    <p className="text-[9px] font-black text-amber-500 tracking-tight">OpenRouter key missing</p>
                    <p className="text-[8px] text-zinc-500 mt-1">Configure it in Settings to use AI</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-[#0a0a0c] border-t border-zinc-900">
            <div className="relative group">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    placeholder="Type your request..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all resize-none max-h-[300px] overflow-y-auto"
                    rows={1}
                />
                <button
                    onClick={onSend}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-lg transition-all"
                >
                    <FiSend size={14} />
                </button>
            </div>
        </div>
    );
};
