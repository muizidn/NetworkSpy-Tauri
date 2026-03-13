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
        body: string | null;
    };
    response: {
        version: string;
        header: {
            [key: string]: string;
        };
        body: string | null;
    } | null;
}
