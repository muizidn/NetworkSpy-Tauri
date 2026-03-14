export interface PayloadTraffic {
    uri?: string;
    method?: string;
    version?: string;
    body_size?: number;
    headers: { [key: string]: string };
    intercepted: boolean;
    status_code?: number;
    client?: string;
    tags: string[];
}

export interface Payload {
    id: string;
    is_request: boolean;
    data: PayloadTraffic;
}
