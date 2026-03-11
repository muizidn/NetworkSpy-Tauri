import { RequestPairData } from "../bottom-pane/RequestTab";
import { invoke as tauriInvoke } from "@tauri-apps/api/tauri";

export interface IAppProvider {
  getRequestPairData(trafficId: string): Promise<RequestPairData>;
  getResponsePairData(trafficId: string): Promise<RequestPairData>;
}

export class TauriAppProvider implements IAppProvider {
  async getRequestPairData(trafficId: string): Promise<RequestPairData> {
    return tauriInvoke<RequestPairData>("get_request_pair_data", { trafficId });
  }

  async getResponsePairData(trafficId: string): Promise<RequestPairData> {
    return tauriInvoke<RequestPairData>("get_response_pair_data", { trafficId });
  }
}

export class MockAppProvider implements IAppProvider {
  async getRequestPairData(trafficId: string): Promise<RequestPairData> {
    console.log(`[Mock] getRequestPairData: ${trafficId}`);
    return {
      id: trafficId,
      headers: [
        ["Content-Type", "application/json"],
        ["X-Source", "MockAppProvider"]
      ],
      body: JSON.stringify({ message: "Mock Request Data", trafficId }, null, 2),
      raw: "GET /mock-request HTTP/1.1\n\n"
    } as unknown as RequestPairData;
  }

  async getResponsePairData(trafficId: string): Promise<RequestPairData> {
    console.log(`[Mock] getResponsePairData: ${trafficId}`);
    return {
      id: trafficId,
      headers: [
        ["Content-Type", "application/json"],
        ["X-Source", "MockAppProvider"]
      ],
      body: JSON.stringify({ message: "Mock Response Data", trafficId }, null, 2),
      raw: "HTTP/1.1 200 OK\n\n"
    } as unknown as RequestPairData;
  }
}
