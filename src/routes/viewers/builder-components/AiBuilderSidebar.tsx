import React, { useState, useRef, useEffect } from "react";
import { FiZap, FiUser, FiCpu, FiSend, FiCheck, FiX, FiMaximize2, FiLoader, FiTrash2, FiEdit3, FiRotateCcw, FiClock, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettingsContext } from "@src/context/SettingsProvider";
import { ViewerBlock } from "@src/context/ViewerContext";

import { invoke } from "@tauri-apps/api/core";
import { useAppProvider } from "@src/packages/app-env";
import systemPrompt from "./prompts/viewer-builder.txt?raw";
import tools from "./prompts/tools.json";
import examples from "./prompts/examples.json";
import { RequestPairData } from "@src/packages/bottom-pane/RequestTab";
import { ResponsePairData } from "@src/packages/bottom-pane/ResponseTab";

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

interface ActiveTool {
    id: string;
    name: string;
    startTime: number;
}

interface AiBuilderSidebarProps {
    isVisible: boolean;
    onClose: () => void;
    blocks: ViewerBlock[];
    onInjectBlock: (block: ViewerBlock) => void;
    onRemoveBlock: (id: string) => void;
    onUpdateBlock: (id: string, updates: Partial<ViewerBlock>) => void;
    onClearBlocks: () => void;
    selectedTrafficId: string;
    testSource: 'live' | 'session';
    selectedSessionId: string;
    testResults: Record<string, any>;
    incomingMessage?: string;
}

const TechnicalMessage: React.FC<{
    msg: ChatMessage;
    getToolIcon: (name: string) => React.ReactNode
}> = ({ msg, getToolIcon }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="flex flex-col mr-auto items-start max-w-[95%] w-full animate-in fade-in slide-in-from-left-2 duration-300">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-2 mb-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group"
            >
                <FiCpu size={10} />
                <span className="text-[8px] font-black tracking-tight uppercase">System Dispatch</span>
                {isCollapsed ? <FiChevronRight size={10} /> : <FiChevronDown size={10} />}
                <span className="text-[7px] font-bold text-zinc-500 bg-zinc-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCollapsed ? "Expand logs" : "Collapse"}
                </span>
            </button>

            {!isCollapsed && (
                <div className="w-full bg-[#0d0d0f] border border-zinc-800/50 rounded-xl overflow-hidden font-mono text-[9px] shadow-sm">
                    {msg.tool_calls?.map((tc, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    <FiCpu size={10} />
                                </div>
                                <div>
                                    <div className="text-zinc-500 text-[8px] leading-none mb-1 font-black">FUNCTION CALLED</div>
                                    <div className="text-white font-bold">{tc.function.name}</div>
                                </div>
                            </div>
                            <div className="text-zinc-600">[{tc.id.substring(0, 8)}]</div>
                        </div>
                    ))}
                    {msg.role === 'tool' && (
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-500/80">
                                <FiCheck size={10} />
                                <span className="text-[8px] font-black uppercase">Execution result</span>
                                <span className="text-zinc-700 ml-auto">{msg.name}</span>
                            </div>
                            <pre className="text-zinc-500 leading-relaxed overflow-x-auto no-scrollbar">
                                {msg.content}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const AiBuilderSidebar: React.FC<AiBuilderSidebarProps> = (props) => {
    const { isVisible, onClose, blocks, onInjectBlock, onRemoveBlock, onUpdateBlock, onClearBlocks } = props;
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

    const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (props.incomingMessage) {
            handleSendMessage(props.incomingMessage);
        }
    }, [props.incomingMessage]);

    const { provider } = useAppProvider();

    const handleSendMessage = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isTyping) return;
        if (!openRouterKey) {
            alert("Please set your OpenRouter API Key in Settings first.");
            return;
        }

        const userMessage: ChatMessage = { role: 'user', content: textToSend };
        let updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        if (!overrideInput) setInput("");
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
                                content: systemPrompt
                                    .replace("{{BLOCKS}}", JSON.stringify(blocks, null, 2))
                                    .replace("{{RESULTS}}", JSON.stringify(props.testResults, null, 2))
                            },
                            ...msgs
                        ],
                        tools,
                        tool_choice: "auto",
                        stream: false
                    })
                });

                if (response.status === 429) throw new Error("Rate limit exceeded.");
                if (!response.ok) throw new Error(`API Error: ${response.status}`);

                return await response.json();
            };

            let data = await fetchChatCompletion(updatedMessages);
            let assistantMessage = data.choices[0].message;

            while (assistantMessage.tool_calls) {
                updatedMessages = [...updatedMessages, assistantMessage];
                setMessages(updatedMessages);

                const toolResponses: ChatMessage[] = [];

                // Set active tools for visualization
                const newActiveTools = assistantMessage.tool_calls.map((tc: any) => ({
                    id: tc.id,
                    name: tc.function.name,
                    startTime: Date.now()
                }));
                setActiveTools(newActiveTools);

                const normalizeHeaders = (headers: any) => {
                    if (Array.isArray(headers)) {
                        return headers.reduce((acc: any, h: any) => ({ ...acc, [h.key || h.name]: h.value }), {});
                    }
                    return headers || {};
                };

                const decodeBody = (body: any) => {
                    if (!body) return "";
                    if (body instanceof Uint8Array || Array.isArray(body)) return new TextDecoder().decode(new Uint8Array(body));
                    return body;
                };

                for (const toolCall of assistantMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let result = "";

                    // Simulate some delay for visual effect
                    await new Promise(r => setTimeout(r, 800));

                    if (functionName === "get_example_block") {
                        result = JSON.stringify((examples as any)[args.category] || "Not found");
                    } else if (functionName === "get_current_traffic_data") {
                        if (!props.selectedTrafficId) {
                            result = "No traffic selected. Ask the user to select an item from the context overlay first.";
                        } else {
                            try {
                                const isReviewMode = props.testSource === 'session';
                                const trafficId = props.selectedTrafficId;
                                const sessionId = props.selectedSessionId;

                                let reqData: RequestPairData | null = null;
                                let resData: ResponsePairData | null = null;
                                if (!isReviewMode) {
                                    reqData = await provider.getRequestPairData(trafficId);
                                    resData = await provider.getResponsePairData(trafficId);
                                } else {
                                    reqData = await invoke("get_session_request_data", { sessionId, trafficId });
                                    resData = await invoke("get_session_response_data", { sessionId, trafficId });
                                }

                                result = JSON.stringify({
                                    request: {
                                        headers: normalizeHeaders(reqData?.headers),
                                        body: decodeBody(reqData?.body)
                                    },
                                    response: {
                                        headers: normalizeHeaders(resData?.headers),
                                        body: decodeBody(resData?.body)
                                    }
                                });
                            } catch (e: any) {
                                result = "Error fetching data: " + e.message;
                            }
                        }
                    } else if (functionName === "inject_block") {
                        onInjectBlock(args.block);
                        result = "Success";
                    } else if (functionName === "update_block") {
                        onUpdateBlock(args.id, args.updates);
                        result = "Success";
                    } else if (functionName === "remove_block") {
                        onRemoveBlock(args.id);
                        result = "Success";
                    } else if (functionName === "clear_all_blocks") {
                        onClearBlocks();
                        result = "Success";
                    }

                    toolResponses.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: result
                    });

                    // Remove from active tools
                    setActiveTools(prev => prev.filter(t => t.id !== toolCall.id));
                }

                updatedMessages = [...updatedMessages, ...toolResponses];
                setMessages(updatedMessages);

                data = await fetchChatCompletion(updatedMessages);
                assistantMessage = data.choices[0].message;
            }

            setMessages([...updatedMessages, assistantMessage]);
        } catch (err: any) {
            setMessages([...updatedMessages, { role: 'assistant', content: `⚠️ ${err.message}` }]);
        } finally {
            setIsTyping(false);
            setActiveTools([]);
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

    const formatDuration = (start: number) => {
        return ((currentTime - start) / 1000).toFixed(1) + "s";
    };

    const getToolIcon = (name: string) => {
        if (name.includes('remove')) return <FiTrash2 size={12} className="text-rose-500" />;
        if (name.includes('clear')) return <FiRotateCcw size={12} className="text-amber-500" />;
        if (name.includes('update')) return <FiEdit3 size={12} className="text-blue-500" />;
        if (name.includes('inject')) return <FiCheck size={12} className="text-emerald-500" />;
        return <FiLoader size={12} className="text-zinc-500 animate-spin" />;
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
                                Ask me to generate, update or remove blocks.
                            </p>
                        </div>
                    </div>
                )}
                {messages.filter(m => m.role !== 'system').map((msg, i) => {
                    const isTechnical = msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls);

                    if (isTechnical) {
                        return <TechnicalMessage key={i} msg={msg} getToolIcon={getToolIcon} />;
                    }

                    if (!msg.content) return null;

                    return (
                        <div key={i} className={twMerge(
                            "flex flex-col max-w-[90%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                            <div className={twMerge(
                                "flex items-center gap-2 mb-1 opacity-50",
                                msg.role === 'user' && "flex-row-reverse"
                            )}>
                                {msg.role === 'user' ? <FiUser size={10} /> : <FiCpu size={10} />}
                                <span className="text-[8px] font-black tracking-tight uppercase">{msg.role}</span>
                            </div>
                            <div className={twMerge(
                                "px-3 py-2 rounded-xl text-[10px] leading-relaxed break-words shadow-sm transition-all",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20"
                                    : "bg-[#151518] text-zinc-300 rounded-tl-none border border-zinc-800"
                            )}>
                                <div className={twMerge(
                                    "prose prose-invert prose-xs max-w-none",
                                    "prose-p:leading-relaxed prose-p:my-1 prose-pre:my-2 prose-pre:bg-black/50 prose-pre:border prose-pre:border-zinc-800 prose-code:text-blue-400 prose-code:bg-zinc-800/50 prose-code:px-1 prose-code:rounded",
                                    "text-[10px]",
                                    msg.role === 'user' && "prose-p:text-white"
                                )}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {msg.role === 'assistant' && msg.content.includes('```') && (
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
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tight">Executing tool</span>
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
                            onClick={() => handleSendMessage()}
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
