import React, { useState, useRef, useEffect } from "react";
import { FiZap, FiUser, FiCpu, FiSend, FiCheck, FiX, FiMaximize2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettingsContext } from "@src/context/SettingsProvider";
import { ViewerBlock } from "@src/context/ViewerContext";

import systemPrompt from "./prompts/viewer-builder.txt?raw";
import tools from "./prompts/tools.json";
import examples from "./prompts/examples.json";

interface ToolCallFunction {
    name: string;
    arguments: string;
}

interface ToolCall {
    id: string;
    type: 'function';
    function: ToolCallFunction;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    name?: string;
}

interface AiBuilderSidebarProps {
    isVisible: boolean;
    onClose: () => void;
    blocks: ViewerBlock[];
    onInjectBlock: (block: ViewerBlock) => void;
}

export const AiBuilderSidebar: React.FC<AiBuilderSidebarProps> = ({
    isVisible, onClose, blocks, onInjectBlock
}) => {
    const { openRouterKey, openRouterModel } = useSettingsContext();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
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

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;
        if (!openRouterKey) {
            alert("Please set your OpenRouter API Key in Settings first.");
            return;
        }

        const userMessage: ChatMessage = { role: 'user', content: input };
        let updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setIsTyping(true);

        try {
            const fetchChatCompletion = async (msgs: ChatMessage[]) => {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://networkspy.app",
                        "X-Title": "NetworkSpy"
                    },
                    body: JSON.stringify({
                        model: openRouterModel,
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt.replace("{{BLOCKS}}", JSON.stringify(blocks, null, 2))
                            },
                            ...msgs
                        ],
                        tools,
                        tool_choice: "auto"
                    })
                });

                if (response.status === 429) {
                    throw new Error("Too many requests or out of credits. Please check your OpenRouter balance.");
                }

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(errorBody.error?.message || `API Error: ${response.status}`);
                }

                return await response.json();
            };

            let data = await fetchChatCompletion(updatedMessages);
            let assistantMessage = data.choices[0].message;

            // Handle Tool Calls
            if (assistantMessage.tool_calls) {
                updatedMessages = [...updatedMessages, assistantMessage];
                setMessages(updatedMessages);

                const toolResponses: ChatMessage[] = [];
                for (const toolCall of assistantMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let result = "";

                    if (functionName === "get_example_block") {
                        const example = (examples as any)[args.category] || "Example not found.";
                        result = JSON.stringify(example);
                    } else if (functionName === "inject_block_directly") {
                        onInjectBlock(args.block);
                        result = "Successfully injected the block.";
                    }

                    toolResponses.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: result
                    });
                }

                updatedMessages = [...updatedMessages, ...toolResponses];
                setMessages(updatedMessages);

                // Get final response after tool calls
                data = await fetchChatCompletion(updatedMessages);
                assistantMessage = data.choices[0].message;
            }

            setMessages([...updatedMessages, assistantMessage]);
        } catch (err: any) {
            setMessages([...updatedMessages, {
                role: 'assistant',
                content: `⚠️ ${err.message}`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const extractAndApplyBlock = (text: string) => {
        const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        if (match) {
            try {
                const newBlock = JSON.parse(match[1]);
                onInjectBlock(newBlock);
            } catch (e) {
                alert("Failed to parse the JSON block from AI response.");
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className={twMerge(
            "absolute top-0 right-0 h-full bg-[#0c0c0e] border-l border-zinc-900 flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-300 transition-all",
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 px-6 text-center space-y-4">
                        <FiCpu size={40} className="text-zinc-600" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 tracking-tight">System Ready</p>
                            <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed">
                                Ask me to generate a specific block or help with styling.
                            </p>
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={twMerge(
                        "flex flex-col max-w-[90%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                        <div className={twMerge(
                            "flex items-center gap-2 mb-1 opacity-50",
                            msg.role === 'user' && "flex-row-reverse"
                        )}>
                            {msg.role === 'user' ? <FiUser size={10} /> : <FiCpu size={10} />}
                            <span className="text-[8px] font-black tracking-tight">{msg.role}</span>
                        </div>
                        <div className={twMerge(
                            "px-3 py-2 rounded-xl text-[10px] leading-relaxed break-words shadow-sm",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800"
                        )}>
                            <div className={twMerge(
                                "prose prose-invert prose-xs max-w-none",
                                "prose-p:leading-relaxed prose-p:my-1 prose-pre:my-2 prose-pre:bg-black/50 prose-pre:border prose-pre:border-zinc-800 prose-code:text-blue-400 prose-code:bg-zinc-800/50 prose-code:px-1 prose-code:rounded",
                                "text-[10px]",
                                msg.role === 'user' && "prose-p:text-white"
                            )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content || ""}
                                </ReactMarkdown>
                            </div>
                            
                            {msg.role === 'assistant' && msg.content && msg.content.includes('```') && (
                                <button
                                    onClick={() => extractAndApplyBlock(msg.content!)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[9px] font-black rounded border border-blue-500/30 transition-all"
                                >
                                    <FiCheck size={12} />
                                    Inject block
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex flex-col mr-auto items-start max-w-[90%]">
                        <div className="flex items-center gap-2 mb-1 opacity-50">
                            <FiCpu size={10} />
                            <span className="text-[8px] font-black tracking-tight">Assistant</span>
                        </div>
                        <div className="bg-zinc-900 text-zinc-500 px-3 py-2 rounded-xl rounded-tl-none border border-zinc-800 animate-pulse italic text-[11px]">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-[#0a0a0c] border-t border-zinc-900">
                {!openRouterKey ? (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
                        <p className="text-[9px] font-black text-amber-500 tracking-tight">OpenRouter key missing</p>
                        <p className="text-[8px] text-zinc-500 mt-1">Configure it in Settings to use AI</p>
                    </div>
                ) : (
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your request..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all resize-none max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-lg transition-all"
                        >
                            <FiSend size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
