export interface PayloadTraffic {
    uri?: string;
    method?: string;
    version?: string;
    body?: string;
    headers: { [key: string]: string };
    intercepted: boolean;
}

export interface Payload {
    id: string;
    is_request: boolean;
    data: PayloadTraffic;
}
