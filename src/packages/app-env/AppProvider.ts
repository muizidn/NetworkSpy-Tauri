import { RequestPairData } from "../bottom-pane/RequestTab";
import { invoke as tauriInvoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Traffic } from "@src/models/Traffic";
import { Payload } from "@src/models/Payload";
import { generateJson } from "@src/routes/home/trafficGenerator";

export interface IAppProvider {
  getRequestPairData(trafficId: string): Promise<RequestPairData>;
  getResponsePairData(trafficId: string): Promise<RequestPairData>;
  listenTraffic(callback: (traffic: Traffic) => void): Promise<() => void>;
  listenSSE(trafficId: string, callback: (chunk: string) => void): () => void;
  listenWebsocket(trafficId: string, callback: (message: any) => void): () => void;
}

export class TauriAppProvider implements IAppProvider {
  private trafficSet: Record<string, Traffic> = {};

  async getRequestPairData(trafficId: string): Promise<RequestPairData> {
    return tauriInvoke<RequestPairData>("get_request_pair_data", { trafficId });
  }

  async getResponsePairData(trafficId: string): Promise<RequestPairData> {
    return tauriInvoke<RequestPairData>("get_response_pair_data", { trafficId });
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
          request: {
            version: payload.data.version || "",
            header: payload.data.headers || {},
            body: payload.data.body || null,
          },
          response: null,
        };
      } else {
        const existing = this.trafficSet[payload.id];
        traffic = {
          ...existing,
          id: payload.id,
          uri: existing?.uri || payload.data.uri || "",
          method: existing?.method || payload.data.method || "",
          request: existing?.request || {
            version: "",
            header: {},
            body: null
          },
          response: {
            version: payload.data.version || "",
            header: payload.data.headers || {},
            body: payload.data.body || null,
          },
        };
      }

      this.trafficSet[payload.id] = traffic;
      callback(traffic);
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
}

export class MockAppProvider implements IAppProvider {
  private trafficSet: Record<string, Traffic> = {};

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
        body: traffic.request.body || "",
        content_type: traffic.request.header?.['content-type'] || traffic.request.header?.['Content-Type'] || "",
        raw: `${traffic.method} ${traffic.uri} ${traffic.request.version}\n\n${traffic.request.body || ""}`
      } as unknown as RequestPairData;
    }

    return {
      id: trafficId,
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "X-Source", value: "MockAppProvider" }
      ],
      body: JSON.stringify({ message: "Mock Request Data (Not Found)", trafficId }, null, 2),
      raw: "GET /mock-request HTTP/1.1\n\n"
    } as unknown as RequestPairData;
  }

  async getResponsePairData(trafficId: string): Promise<RequestPairData> {
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
        body: traffic.response.body || "",
        content_type: traffic.response.header?.['content-type'] || traffic.response.header?.['Content-Type'] || "",
        raw: `${traffic.response.version} 200 OK\n\n${traffic.response.body || ""}`
      } as unknown as RequestPairData;
    }

    return {
      id: trafficId,
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "X-Source", value: "MockAppProvider" }
      ],
      body: JSON.stringify({ message: "Mock Response Data (Not Found)", trafficId }, null, 2),
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
    const responseBody = traffic.response?.body || "";
    const isStreaming = responseBody.includes('data:');
    
    if (isStreaming) {
        const chunks = responseBody.split('\n').filter(l => l.trim().length > 0);
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

    return () => {};
  }

  listenWebsocket(trafficId: string, callback: (message: any) => void): () => void {
    const interval = setInterval(() => {
        callback({ type: 'message', data: `Ping from mock WS ${trafficId}: ${Date.now()}` });
    }, 2000);
    return () => clearInterval(interval);
  }

  async listenTraffic(callback: (traffic: Traffic) => void): Promise<() => void> {
    let batch: any[] = [];
    const interval = setInterval(() => {
      if (batch.length === 0) {
        batch = generateJson(50);
      }
      const item = batch.shift();
      if (item) {
        const traffic: Traffic = {
          id: item.id,
          uri: item.url as string,
          method: item.method as string,
          request: {
            version: "HTTP/1.1",
            header: {
                "content-type": "text/plain",
                ...Object.fromEntries(Object.entries(item.headers || {}).map(([k, v]) => [k.toLowerCase(), v]))
            },
            body: item.request as string || null,
          },
          response: {
            version: "HTTP/1.1",
            header: {
                "content-type": "application/json",
                ...Object.fromEntries(Object.entries(item.responseHeaders || {}).map(([k, v]) => [k.toLowerCase(), v]))
            },
            body: item.response as string || null,
          },
        };
        this.trafficSet[traffic.id] = traffic;
        callback(traffic);
      }
    }, 300);
    return () => clearInterval(interval);
  }
}
