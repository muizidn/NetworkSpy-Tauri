export interface Traffic {
    id: string;
    uri: string;
    method: string;
    intercepted: boolean;
    request: {
        version: string;
        header: {
            [key: string]: string;
        };
        size: number;
    };
    response: {
        version: string;
        header: {
            [key: string]: string;
        };
        size: number;
        status_code: number;
    } | null;
    time: string;
    duration: string;
    timestamp: number;
    client: string;
}
