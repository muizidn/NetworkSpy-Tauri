import { ViewerBlock } from "@src/context/ViewerContext";

export interface ToolCallFunction {
    name: string;
    arguments: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: ToolCallFunction;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    name?: string;
    duration?: number;
}

export interface ActiveTool {
    id: string;
    name: string;
    startTime: number;
}

export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

export interface AiBuilderSidebarProps {
    isVisible: boolean;
    onClose: () => void;
    blocks: ViewerBlock[];
    onInjectBlock: (block: ViewerBlock) => void;
    onRemoveBlock: (id: string) => void;
    onUpdateBlock: (id: string, updates: Partial<ViewerBlock>) => void;
    onClearBlocks: () => void;
    onReorderBlocks: (ids: string[]) => void;
    onSetTestSource: (source: 'live' | 'session') => void;
    onSetSelectedTrafficId: (id: string) => void;
    onSetSelectedSessionId: (id: string) => void;
    selectedTrafficId: string;
    testSource: 'live' | 'session';
    selectedSessionId: string;
    testResults: Record<string, any>;
    incomingMessage?: string;
}
