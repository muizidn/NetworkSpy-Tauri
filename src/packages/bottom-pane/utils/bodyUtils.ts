export const decodeBody = (body: Uint8Array | undefined | null | string, contentType: string = ""): string => {
  if (!body || body.length === 0) return "";
  
  // If it's already a string, just try to beautify it if it's JSON
  if (typeof body === 'string') {
    if (contentType.toLowerCase().includes("json")) {
        try {
          return JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
          return body;
        }
      }
      return body;
  }

  try {
    const text = new TextDecoder().decode(body);
    if (contentType.toLowerCase().includes("json")) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        return text;
      }
    }
    return text;
  } catch (e) {
    console.error("Failed to decode body", e);
    return "[Binary Data]";
  }
};

export const parseBodyAsJson = (body: Uint8Array | undefined | null | string): any => {
    if (!body || body.length === 0) return null;
    try {
        const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
};
export interface ToolCall {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export const parseSSE = (body: Uint8Array | undefined | null | string): { content: string; toolCalls: ToolCall[]; model: string; finishReason: string; usage: any } => {
    if (!body || body.length === 0) return { content: "", toolCalls: [], model: "", finishReason: "", usage: null };
    const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
    let combined = "";
    let model = "";
    let finishReason = "";
    let usage = null;
    const toolCallsMap: Record<number, any> = {};
    
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
                const json = JSON.parse(dataStr);
                if (json.model) model = json.model;
                if (json.usage) usage = json.usage;

                const choice = json.choices?.[0];
                if (!choice) continue;

                if (choice.finish_reason) finishReason = choice.finish_reason;

                const content = choice.delta?.content || choice.text || "";
                combined += content;

                const tool_calls = choice.delta?.tool_calls;
                if (tool_calls && Array.isArray(tool_calls)) {
                  for (const toolCall of tool_calls) {
                    const index = toolCall.index;
                    if (toolCallsMap[index] === undefined) {
                      toolCallsMap[index] = { ...toolCall };
                    } else {
                      if (toolCall.id) toolCallsMap[index].id = toolCall.id;
                      if (toolCall.type) toolCallsMap[index].type = toolCall.type;
                      if (toolCall.function) {
                        if (toolCall.function.name) toolCallsMap[index].function.name = toolCall.function.name;
                        if (toolCall.function.arguments) {
                          toolCallsMap[index].function.arguments = (toolCallsMap[index].function.arguments || "") + toolCall.function.arguments;
                        }
                      }
                    }
                  }
                }
            } catch (e) {}
        }
    }
    return { 
        content: combined, 
        toolCalls: Object.values(toolCallsMap).sort((a, b) => (a.index || 0) - (b.index || 0)),
        model,
        finishReason,
        usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
};

export const parseSSEChunks = (body: Uint8Array | undefined | null | string): { data: string; content: string; event: string }[] => {
    if (!body || body.length === 0) return [];
    
    const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
    const results: { data: string; content: string; event: string }[] = [];
    
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
            const rawData = trimmed;
            const dataStr = trimmed.slice(6).trim();
            
            if (dataStr === '[DONE]') {
                results.push({ data: rawData, content: "", event: "control" });
                continue;
            }
            
            try {
                const json = JSON.parse(dataStr);
                const choice = json.choices?.[0];
                const delta = choice?.delta;
                
                let content = "";
                if (delta) {
                    if (typeof delta.content === 'string') content = delta.content;
                    else if (Array.isArray(delta.content)) content = delta.content.map((p: any) => p.text || "").join("");
                } else if (choice?.text) {
                    content = choice.text;
                }
                
                results.push({ data: rawData, content, event: "message" });
            } catch (e) {
                // If it's not JSON, might be raw text
                results.push({ data: rawData, content: "", event: "message" });
            }
        }
    }
    return results;
};
