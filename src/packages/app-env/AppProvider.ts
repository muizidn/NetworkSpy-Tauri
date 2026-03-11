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
              "content-type": item.url?.includes("graphql") ? "application/json" : "text/plain"
            },
            body: item.request as string || null,
          },
          response: {
            version: "HTTP/1.1",
            header: {
              "content-type": "application/json"
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
