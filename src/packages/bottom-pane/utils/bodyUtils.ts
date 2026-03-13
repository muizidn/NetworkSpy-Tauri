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
export const parseSSE = (body: Uint8Array | undefined | null | string): string => {
    if (!body || body.length === 0) return "";
    const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
    let combined = "";
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
                const json = JSON.parse(dataStr);
                const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || "";
                combined += content;
            } catch (e) {}
        }
    }
    return combined;
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
