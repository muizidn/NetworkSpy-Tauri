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
