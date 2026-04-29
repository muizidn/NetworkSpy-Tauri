import React from "react";
import { FiUser, FiCpu, FiCheck } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from "./types";

interface ChatMessageItemProps {
    msg: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg }) => {
    if (!msg.content) return null;

    return (
        <div className={twMerge(
            "flex flex-col max-w-[95%] w-fit animate-in fade-in slide-in-from-bottom-2 duration-300",
            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
        )}>
            <div className={twMerge(
                "flex items-center gap-2 mb-1 opacity-50",
                msg.role === 'user' && "flex-row-reverse"
            )}>
                {msg.role === 'user' ? <FiUser size={10} /> : <FiCpu size={10} />}
                <span className="text-[9px] font-bold uppercase tracking-tight">{msg.role}</span>
            </div>
            <div className={twMerge(
                "px-3 py-2 rounded-xl text-[10px] leading-relaxed break-words shadow-sm transition-all overflow-hidden w-full",
                msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20"
                    : "bg-[#151518] text-zinc-300 rounded-tl-none border border-zinc-800"
            )}>
                <div className={twMerge(
                    "prose prose-invert prose-xs max-w-none break-words",
                    "prose-p:leading-relaxed prose-p:my-1",
                    "prose-pre:my-2 prose-pre:bg-black/50 prose-pre:border prose-pre:border-zinc-800 prose-pre:p-2 prose-pre:rounded-lg prose-pre:overflow-x-auto custom-scrollbar",
                    "prose-code:text-blue-400 prose-code:bg-zinc-800/50 prose-code:px-1 prose-code:rounded",
                    "text-[10px]",
                    msg.role === 'user' && "prose-p:text-white"
                )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
