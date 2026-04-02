import { RequestPairData } from "../bottom-pane/RequestTab";
import { ResponsePairData } from "../bottom-pane/ResponseTab";
import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Traffic } from "@src/models/Traffic";
import { Payload } from "@src/models/Payload";
import { generateJson } from "@src/routes/home/trafficGenerator";
import { readFile } from "@tauri-apps/plugin-fs";

const formatTimestamp = (date: Date) => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
};

export interface CustomChecker {
    id: string;
    name: string;
    description: string;
    script: string;
    enabled: boolean;
    category: string;
    createdAt?: string;
}

export interface BreakpointHit {
  id: string;
  name: string;
}

export interface BreakpointData {
  id: string;
  headers: Record<string, string>;
  body: number[]; // Vec<u8> in Rust comes as array in JS
  method?: string;
  uri?: string;
  status_code?: number;
}

export interface IAppProvider {
  getRequestPairData(trafficId: string): Promise<RequestPairData>;
  getResponsePairData(trafficId: string): Promise<ResponsePairData>;
  listenTraffic(callback: (traffic: Traffic) => void): Promise<() => void>;
  listenSSE(trafficId: string, callback: (chunk: string) => void): () => void;
  listenWebsocket(trafficId: string, callback: (message: any) => void): () => void;
  setListenStatus(isRun: boolean): Promise<number | void>;
  changeProxyPort(port: number): Promise<number>;
  listenTagsUpdated(callback: (event: { id: string, tags: string[] }) => void): Promise<() => void>;
  updateInterceptAllowList(newList: string[]): Promise<void>;
  message(message: string, options?: { title?: string, type?: 'info' | 'error' | 'warning' }): Promise<void>;
  saveSession(): Promise<void>;
  loadSession(): Promise<void>;
  clearData(): Promise<void>;
  getAllMetadata(): Promise<any[]>;
  getCustomCheckers(category: string): Promise<CustomChecker[]>;
  saveCustomChecker(checker: Partial<CustomChecker>): Promise<CustomChecker>;
  deleteCustomChecker(id: string): Promise<void>;
  resumeBreakpoint(trafficId: string, modifiedData?: BreakpointData): Promise<void>;
  getPausedBreakpoints(): Promise<BreakpointHit[]>;
  getPausedData(id: string): Promise<BreakpointData>;
  openNewWindow(context: string, title: string): Promise<void>;
}

export class TauriAppProvider implements IAppProvider {
  private trafficSet: Record<string, Traffic> = {};

  async setListenStatus(isRun: boolean): Promise<number | void> {
    if (isRun) {
      return await tauriInvoke<number>("turn_on_proxy");
    } else {
      await tauriInvoke("turn_off_proxy");
    }
  }

  async changeProxyPort(port: number): Promise<number> {
    return await tauriInvoke<number>("change_proxy_port", { port });
  }

  async getRequestPairData(trafficId: string): Promise<RequestPairData> {
    const data = await tauriInvoke<RequestPairData>("get_request_pair_data", { trafficId });

    if (data.body_path) {
      try {
        data.body = await readFile(data.body_path);
      } catch (e) {
        console.error("Failed to read request body file", e);
      }
    }

    return data;
  }

  async getResponsePairData(trafficId: string): Promise<ResponsePairData> {
    const data = await tauriInvoke<ResponsePairData>("get_response_pair_data", { trafficId });

    if (data.body_path) {
      try {
        data.body = await readFile(data.body_path);
      } catch (e) {
        console.error("Failed to read response body file", e);
      }
    }
    return data;
  }

  async updateInterceptAllowList(newList: string[]): Promise<void> {
    return tauriInvoke("update_intercept_allow_list", { newList });
  }

  async message(messageText: string, options?: { title?: string, type?: 'info' | 'error' | 'warning' }): Promise<void> {
    const { message } = await import("@tauri-apps/plugin-dialog");
    await message(messageText, options);
  }

  async saveSession(): Promise<void> {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({
      filters: [{ name: "HAR", extensions: ["har"] }],
      defaultPath: "session.har"
    });
    if (path) {
      await tauriInvoke("save_session", { path });
    }
  }

  async loadSession(): Promise<void> {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({
      filters: [{ name: "HAR", extensions: ["har"] }],
      multiple: false
    });
    if (path) {
      await tauriInvoke("load_session", { path });
    }
  }

  async clearData(): Promise<void> {
    this.trafficSet = {};
  }

  async getAllMetadata(): Promise<any[]> {
    return await tauriInvoke<any[]>("get_all_metadata");
  }

  async listenTraffic(callback: (traffic: Traffic) => void): Promise<() => void> {
    return listen<Payload>("traffic_event", (event) => {
      const payload = event.payload;
      let traffic: Traffic;

      if (payload.is_request) {
        traffic = {
          id: payload.id,
          uri: payload.data.uri || "",
          method: payload.data.method || "",
          intercepted: payload.data.intercepted,
          request: {
            version: payload.data.version || "",
            header: payload.data.headers || {},
            size: payload.data.body_size || 0,
          },
          response: null,
          time: formatTimestamp(new Date()),
          duration: "0ms",
          timestamp: Date.now(),
          client: payload.data.client || "127.0.0.1",
          tags: payload.data.tags || [],
        };
      } else {
        const existing = this.trafficSet[payload.id];
        traffic = {
          ...existing,
          id: payload.id,
          uri: existing?.uri || payload.data.uri || "",
          method: existing?.method || payload.data.method || "",
          intercepted: payload.data.intercepted,
          request: existing?.request || {
            version: "",
            header: {},
            size: 0,
          },
          response: {
            version: payload.data.version || "",
            header: payload.data.headers || {},
            size: payload.data.body_size || 0,
            status_code: payload.data.status_code || 0,
          },
          time: existing?.time || formatTimestamp(new Date()),
          duration: `${payload.data.headers['x-latency-ms'] || 0}ms`,
          timestamp: existing?.timestamp || Date.now(),
          client: payload.data.client || existing?.client || "127.0.0.1",
          tags: existing?.tags || [],
        };
      }

      this.trafficSet[payload.id] = traffic;
      callback(traffic);
    });
  }

  async listenTagsUpdated(callback: (event: { id: string, tags: string[] }) => void): Promise<() => void> {
    return listen<{ id: string, tags: string[] }>("tags_updated", (event) => {
      const payload = event.payload;
      const existing = this.trafficSet[payload.id];
      if (existing) {
        existing.tags = payload.tags;
      }
      callback(payload);
    });
  }

  listenSSE(trafficId: string, callback: (chunk: string) => void): () => void {
    const unlisten = listen<any>(`sse_${trafficId}`, (event) => {
      callback(event.payload);
    });
    return () => {
      unlisten.then(u => u());
    };
  }

  listenWebsocket(trafficId: string, callback: (message: any) => void): () => void {
    const unlisten = listen<any>(`ws_${trafficId}`, (event) => {
      callback(event.payload);
    });
    return () => {
      unlisten.then(u => u());
    };
  }

  async getCustomCheckers(category: string): Promise<CustomChecker[]> {
    return await tauriInvoke<CustomChecker[]>("get_custom_checkers", { category });
  }

  async saveCustomChecker(checker: Partial<CustomChecker>): Promise<CustomChecker> {
    return await tauriInvoke<CustomChecker>("save_custom_checker", {
      id: checker.id,
      name: checker.name,
      description: checker.description,
      script: checker.script,
      enabled: checker.enabled,
      category: checker.category || "sensitive_data"
    });
  }

  async deleteCustomChecker(id: string): Promise<void> {
    return await tauriInvoke("delete_custom_checker", { id });
  }

  async resumeBreakpoint(trafficId: string, modifiedData?: BreakpointData): Promise<void> {
    return await tauriInvoke("resume_breakpoint", { trafficId, modifiedData });
  }

  async getPausedData(id: string): Promise<BreakpointData> {
    return await tauriInvoke<BreakpointData>("get_paused_data", { id });
  }

  async getPausedBreakpoints(): Promise<BreakpointHit[]> {
    return await tauriInvoke<BreakpointHit[]>("get_paused_breakpoints");
  }

  async openNewWindow(context: string, title: string): Promise<void> {
    return await tauriInvoke("open_new_window", { context, title });
  }
}

export class MockAppProvider implements IAppProvider {
  private trafficSet: Record<string, Traffic> = {};
  private mockBodySet: Record<string, { request: string; response: string }> = {};
  private isListening: boolean = false;
  private allowList: Set<string> = new Set([]);

  async setListenStatus(isRun: boolean): Promise<number | void> {
    this.isListening = isRun;
    console.log(`[MockAppProvider] Traffic Generation: ${isRun ? 'RESUMED' : 'PAUSED'}`);
    if (isRun) return 9090;
  }

  async changeProxyPort(port: number): Promise<number> {
    console.log(`[MockAppProvider] Proxy Port Changed to: ${port}`);
    return port;
  }

  async getRequestPairData(trafficId: string): Promise<RequestPairData> {
    console.log(`[Mock] getRequestPairData: ${trafficId}`);
    const traffic = this.trafficSet[trafficId];

    if (traffic) {
      const urlObj = new URL(traffic.uri);
      const paramKeys = Array.from(new Set(urlObj.searchParams.keys()));
      const params = paramKeys.map(key => {
        const values = urlObj.searchParams.getAll(key);
        return { key, value: values.length > 1 ? values : values[0] };
      });

      return {
        id: trafficId,
        headers: Object.entries(traffic.request.header || {}).map(([key, value]) => ({ key, value })),
        params,
        body: new TextEncoder().encode(this.mockBodySet[trafficId]?.request || ""),
        content_type: traffic.request.header?.['content-type'] || traffic.request.header?.['Content-Type'] || "",
        raw: `${traffic.method} ${traffic.uri} ${traffic.request.version}\n\n${this.mockBodySet[trafficId]?.request || ""}`
      } as unknown as RequestPairData;
    }

    return {
      id: trafficId,
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "X-Source", value: "MockAppProvider" }
      ],
      body: new TextEncoder().encode(JSON.stringify({ message: "Mock Request Data (Not Found)", trafficId }, null, 2)),
      raw: "GET /mock-request HTTP/1.1\n\n"
    } as unknown as RequestPairData;
  }

  async getResponsePairData(trafficId: string): Promise<ResponsePairData> {
    console.log(`[Mock] getResponsePairData: ${trafficId}`);
    const traffic = this.trafficSet[trafficId];

    if (traffic && traffic.response) {
      const urlObj = new URL(traffic.uri);
      const paramKeys = Array.from(new Set(urlObj.searchParams.keys()));
      const params = paramKeys.map(key => {
        const values = urlObj.searchParams.getAll(key);
        return { key, value: values.length > 1 ? values : values[0] };
      });

      return {
        id: trafficId,
        headers: Object.entries(traffic.response.header || {}).map(([key, value]) => ({ key, value })),
        params,
        body: new TextEncoder().encode(this.mockBodySet[trafficId]?.response || ""),
        content_type: traffic.response.header?.['content-type'] || traffic.response.header?.['Content-Type'] || "",
        raw: `${traffic.response.version} 200 OK\n\n${this.mockBodySet[trafficId]?.response || ""}`
      } as unknown as RequestPairData;
    }

    return {
      id: trafficId,
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "X-Source", value: "MockAppProvider" }
      ],
      body: new TextEncoder().encode(JSON.stringify({ message: "Mock Response Data (Not Found)", trafficId }, null, 2)),
      raw: "HTTP/1.1 200 OK\n\n"
    } as unknown as RequestPairData;
  }

  listenSSE(trafficId: string, callback: (chunk: string) => void): () => void {
    const traffic = this.trafficSet[trafficId];
    if (!traffic || !traffic.uri.includes('openai')) {
      // Fallback demo for non-mocked SSE
      const demoChunks = [
        'data: {"choices":[{"delta":{"content":"Hello! "}}]}',
        'data: {"choices":[{"delta":{"content":"I "}}]}',
        'data: {"choices":[{"delta":{"content":"am "}}]}',
        'data: {"choices":[{"delta":{"content":"a "}}]}',
        'data: {"choices":[{"delta":{"content":"mock "}}]}',
        'data: {"choices":[{"delta":{"content":"SSE "}}]}',
        'data: {"choices":[{"delta":{"content":"stream."}}]}',
        'data: [DONE]'
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i >= demoChunks.length) {
          clearInterval(interval);
          return;
        }
        callback(demoChunks[i++]);
      }, 100);
      return () => clearInterval(interval);
    }

    // For OpenAI mocked data, we can "re-stream" its response if it was marked as streaming
    const responseBody = this.mockBodySet[trafficId]?.response || "";
    const isStreaming = responseBody.includes('data:');

    if (isStreaming) {
      const chunks = responseBody.split('\n').filter((l: string) => l.trim().length > 0);
      let i = 0;
      const interval = setInterval(() => {
        if (i >= chunks.length) {
          clearInterval(interval);
          return;
        }
        callback(chunks[i++]);
      }, 80);
      return () => clearInterval(interval);
    }

    return () => { };
  }

  listenWebsocket(trafficId: string, callback: (message: any) => void): () => void {
    const interval = setInterval(() => {
      callback({ type: 'message', data: `Ping from mock WS ${trafficId}: ${Date.now()}` });
    }, 2000);
    return () => clearInterval(interval);
  }

  async listenTagsUpdated(_callback: (event: { id: string, tags: string[] }) => void): Promise<() => void> {
    return () => { };
  }

  async listenTraffic(callback: (traffic: Traffic) => void): Promise<() => void> {
    let batch: any[] = [];
    const interval = setInterval(() => {
      if (!this.isListening) return; // PROACTIVE PAUSE

      if (batch.length === 0) {
        batch = generateJson(50);
      }
      const item = batch.shift();
      if (item) {
        let intercepted = false;
        try {
          const url = new URL(item.url as string);
          intercepted = this.allowList.has(url.hostname);
        } catch (e) {
          intercepted = true; // Fallback for relative or malformed URLs in mock
        }

        const reqBody = item.request as string || "";
        const resBody = item.response as string || "";

        const traffic: Traffic = {
          id: item.id,
          uri: item.url as string,
          method: item.method as string,
          intercepted: intercepted,
          request: {
            version: "HTTP/1.1",
            header: {
              "content-type": "text/plain",
              ...Object.fromEntries(Object.entries(item.headers || {}).map(([k, v]) => [k.toLowerCase(), v]))
            },
            size: reqBody.length,
          },
          response: {
            version: "HTTP/1.1",
            header: {
              "content-type": "application/json",
              ...Object.fromEntries(Object.entries(item.responseHeaders || {}).map(([k, v]) => [k.toLowerCase(), v]))
            },
            size: resBody.length,
            status_code: 200,
          },
          time: formatTimestamp(new Date(item.timestamp || Date.now())),
          duration: `${Math.floor(Math.random() * 100) + 20}ms`,
          timestamp: item.timestamp || Date.now(),
          client: "Local (Mock)",
          tags: [],
        };
        this.trafficSet[traffic.id] = traffic;
        this.mockBodySet[traffic.id] = { request: reqBody, response: resBody };
        callback(traffic);
      }
    }, 300);
    return () => clearInterval(interval);
  }

  async updateInterceptAllowList(newList: string[]): Promise<void> {
    newList.forEach(d => this.allowList.add(d));
    console.log(`[Mock] Allow List Updated:`, Array.from(this.allowList));
  }

  async message(messageText: string, options?: { title?: string, type?: 'info' | 'error' | 'warning' }): Promise<void> {
    console.log(`[Mock Dialog] [${options?.type || 'info'}] ${options?.title ? `${options.title}: ` : ''}${messageText}`);
    alert(`${options?.title ? `${options.title}\n\n` : ''}${messageText}`);
  }

  async clearData(): Promise<void> {
    console.log("[Mock] Clearing traffic data");
    this.trafficSet = {};
    this.mockBodySet = {};
  }

  async getAllMetadata(): Promise<any[]> {
    return [];
  }

  async getCustomCheckers(_category: string): Promise<CustomChecker[]> {
    return [];
  }

  async saveCustomChecker(checker: Partial<CustomChecker>): Promise<CustomChecker> {
    return {
      id: checker.id || "mock-id",
      name: checker.name || "Mock Checker",
      description: checker.description || "",
      script: checker.script || "",
      enabled: checker.enabled ?? true,
      category: checker.category || "sensitive_data",
      createdAt: new Date().toISOString()
    };
  }

  async deleteCustomChecker(_id: string): Promise<void> { }

  async resumeBreakpoint(trafficId: string, _modifiedData?: BreakpointData): Promise<void> {
    console.log(`[Mock] Resuming breakpoint: ${trafficId}`);
  }

  async getPausedData(id: string): Promise<BreakpointData> {
    return { id, headers: {}, body: [] };
  }

  async getPausedBreakpoints(): Promise<BreakpointHit[]> {
    return [];
  }

  async openNewWindow(context: string, title: string): Promise<void> {
    console.log(`[Mock] Opening window: ${context} (${title})`);
  }

  async saveSession(): Promise<void> {
    console.log("[Mock] Save session (HAR)");
  }

  async loadSession(): Promise<void> {
    console.log("[Mock] Load session (HAR)");
  }
}
