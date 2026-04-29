import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsContext } from "@src/context/SettingsProvider";
import { useAppProvider } from "@src/packages/app-env";
import systemPromptTemplate from "../prompts/viewer-builder.txt?raw";
import tools from "../prompts/tools.json";
import examples from "../prompts/examples.json";
import { ChatMessage, ActiveTool, OpenRouterModel, AiBuilderSidebarProps } from "./types";
import defaultModels from "../prompts/models.json";

export const useAiBuilderChat = (props: AiBuilderSidebarProps) => {
    const { openRouterKey, openRouterModel, setOpenRouterModel } = useSettingsContext();
    const { provider } = useAppProvider();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>(defaultModels);
    const [isFetchingModels, setIsFetchingModels] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchModels = async () => {
            if (!openRouterKey) return;
            setIsFetchingModels(true);
            try {
                const response = await fetch("https://openrouter.ai/api/v1/models");
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && Array.isArray(data.data)) {
                        setAvailableModels(data.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch OpenRouter models:", err);
            } finally {
                setIsFetchingModels(false);
            }
        };
        fetchModels();
    }, [openRouterKey]);

    useEffect(() => {
        if (props.incomingMessage) {
            handleSendMessage(props.incomingMessage);
        }
    }, [props.incomingMessage]);

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
        if (!overrideInput) {
            setInput("");
        }
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
                                content: systemPromptTemplate
                                    .replace("{{BLOCKS}}", JSON.stringify(props.blocks, null, 2))
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
                    const startTime = Date.now();
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let result = "";

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

                                let reqData: any = null;
                                let resData: any = null;
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
                        props.onInjectBlock(args.block);
                        result = "Success";
                    } else if (functionName === "update_block") {
                        props.onUpdateBlock(args.id, args.updates);
                        result = "Success";
                    } else if (functionName === "remove_block") {
                        props.onRemoveBlock(args.id);
                        result = "Success";
                    } else if (functionName === "clear_all_blocks") {
                        props.onClearBlocks();
                        result = "Success";
                    } else if (functionName === "reorder_blocks") {
                        props.onReorderBlocks(args.blockIds);
                        result = "Success";
                    } else if (functionName === "set_test_traffic") {
                        if (args.testSource) props.onSetTestSource(args.testSource);
                        if (args.sessionId) props.onSetSelectedSessionId(args.sessionId);
                        props.onSetSelectedTrafficId(args.trafficId);
                        result = "Success";
                    }

                    toolResponses.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: result,
                        duration: Date.now() - startTime
                    });

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


    return {
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
    };
};
