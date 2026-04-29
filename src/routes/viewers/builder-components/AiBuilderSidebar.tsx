import React, { useState, useRef, useEffect } from "react";
import { FiZap, FiCpu, FiX, FiMaximize2, FiLoader, FiTrash2, FiEdit3, FiRotateCcw, FiClock, FiCheck, FiDatabase } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

import { AiBuilderSidebarProps } from "./ai-sidebar/types";
import { TechnicalMessage } from "./ai-sidebar/TechnicalMessage";
import { ModelSelector } from "./ai-sidebar/ModelSelector";
import { ChatMessageItem } from "./ai-sidebar/ChatMessageItem";
import { ChatInput } from "./ai-sidebar/ChatInput";
import { useAiBuilderChat } from "./ai-sidebar/useAiBuilderChat";

export const AiBuilderSidebar: React.FC<AiBuilderSidebarProps> = (props) => {
    const { isVisible, onClose } = props;
    const {
        messages,
        input,
        setInput,
        isTyping,
        activeTools,
        currentTime,
        availableModels,
        isFetchingModels,
        openRouterKey,
        openRouterModel,
        setOpenRouterModel,
        handleSendMessage
    } = useAiBuilderChat(props);

    const [widthPreset, setWidthPreset] = useState<'narrow' | 'medium' | 'wide'>('narrow');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const cycleWidth = () => {
        const presets: ('narrow' | 'medium' | 'wide')[] = ['narrow', 'medium', 'wide'];
        const nextIndex = (presets.indexOf(widthPreset) + 1) % presets.length;
        setWidthPreset(presets[nextIndex]);
    };

    const widthClasses = {
        narrow: "w-96",
        medium: "w-[512px]",
        wide: "w-[768px]"
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const formatDuration = (start: number) => {
        return ((currentTime - start) / 1000).toFixed(1) + "s";
    };

    const getToolIcon = (name: string) => {
        if (name.includes('remove')) return <FiTrash2 size={12} className="text-rose-500" />;
        if (name.includes('clear')) return <FiRotateCcw size={12} className="text-amber-500" />;
        if (name.includes('update')) return <FiEdit3 size={12} className="text-blue-500" />;
        if (name.includes('inject')) return <FiCheck size={12} className="text-emerald-500" />;
        if (name.includes('set_test_traffic')) return <FiDatabase size={12} className="text-purple-500" />;
        return <FiLoader size={12} className="text-zinc-500 animate-spin" />;
    };

    if (!isVisible) return null;

    return (
        <div className={twMerge(
            "relative h-full bg-[#0c0c0e] border-l border-zinc-900 flex flex-col z-50 shadow-2xl transition-all",
            widthClasses[widthPreset]
        )}>
            <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-[#0a0a0c]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                        <FiZap size={14} />
                    </div>
                    <h3 className="text-[10px] font-black text-white tracking-tight">AI Builder Chat</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={cycleWidth}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                        title="Resize Sidebar"
                    >
                        <FiMaximize2 size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            <ModelSelector 
                availableModels={availableModels}
                currentModel={openRouterModel}
                onSelectModel={setOpenRouterModel}
                isFetching={isFetchingModels}
            />

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 px-6 text-center space-y-4">
                        <FiCpu size={40} className="text-zinc-600" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 tracking-tight">System Ready</p>
                            <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed">
                                Ask me to generate, update or remove blocks.
                            </p>
                        </div>
                    </div>
                )}
                
                {messages.filter(m => m.role !== 'system').map((msg, i) => {
                    const isToolResult = msg.role === 'tool';
                    const isAssistantCallOnly = msg.role === 'assistant' && msg.tool_calls && !msg.content;

                    if (isAssistantCallOnly) return null;

                    if (isToolResult) {
                        return <TechnicalMessage key={i} msg={msg} getToolIcon={getToolIcon} />;
                    }

                    return (
                        <ChatMessageItem 
                            key={i} 
                            msg={msg} 
                        />
                    );
                })}

                {(isTyping || activeTools.length > 0) && (
                    <div className="flex flex-col mr-auto items-start max-w-[90%] space-y-2">
                        <div className="flex items-center gap-2 mb-1 opacity-50">
                            <FiCpu size={10} />
                            <span className="text-[8px] font-black tracking-tight">Assistant</span>
                        </div>

                        {activeTools.length > 0 ? (
                            activeTools.map(tool => (
                                <div key={tool.id} className="bg-[#121214] border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 w-64 shadow-lg animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                                        <FiLoader className="animate-spin text-blue-500" size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-zinc-400">Executing tool</span>
                                            <span className="text-[8px] font-mono text-zinc-600 flex items-center gap-1">
                                                <FiClock size={8} />
                                                {formatDuration(tool.startTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getToolIcon(tool.name)}
                                            <span className="text-[10px] font-bold text-white truncate">{tool.name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-zinc-900 text-zinc-500 px-3 py-2 rounded-xl rounded-tl-none border border-zinc-800 animate-pulse italic text-[10px]">
                                Thinking...
                            </div>
                        )}
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <ChatInput 
                input={input}
                setInput={setInput}
                onSend={() => handleSendMessage()}
                isTyping={isTyping}
                hasApiKey={!!openRouterKey}
            />
        </div>
    );
};
