import { invoke } from "@tauri-apps/api/core";
import { ViewerBlock } from "@src/context/ViewerContext";

interface RunnerOptions {
    trafficId: string;
    isReviewMode: boolean;
    reviewedSessionId?: string;
    provider: any;
}

export const executeViewerBlock = async (block: ViewerBlock, options: RunnerOptions) => {
    const { trafficId, isReviewMode, reviewedSessionId, provider } = options;
    if (!trafficId) return { error: "No traffic selected" };

    const decoder = new TextDecoder();

    const normalizeHeaders = (headers: any) => {
        if (Array.isArray(headers)) {
            return headers.reduce((acc: any, h: any) => ({ ...acc, [h.key || h.name]: h.value }), {});
        }
        return headers || {};
    };

    const readRequestHeaders = async () => {
        if (!isReviewMode) {
            const data = await provider.getRequestPairData(trafficId);
            return normalizeHeaders(data?.headers);
        }
        const data: any = await invoke("get_session_request_data", { sessionId: reviewedSessionId, trafficId });
        return normalizeHeaders(data?.headers);
    };

    const readRequestBody = async () => {
        let body: any;
        if (!isReviewMode) body = (await provider.getRequestPairData(trafficId))?.body;
        else body = await invoke("get_session_request_data", { sessionId: reviewedSessionId, trafficId }).then((d: any) => d?.body);

        if (!body) return "";
        if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
        return body;
    };

    const readResponseHeaders = async () => {
        if (!isReviewMode) {
            const data = await provider.getResponsePairData(trafficId);
            return normalizeHeaders(data?.headers);
        }
        const data: any = await invoke("get_session_response_data", { sessionId: reviewedSessionId, trafficId });
        return normalizeHeaders(data?.headers);
    };

    const readResponseBody = async () => {
        let body: any;
        if (!isReviewMode) body = (await provider.getResponsePairData(trafficId))?.body;
        else body = await invoke("get_session_response_data", { sessionId: reviewedSessionId, trafficId }).then((d: any) => d?.body);

        if (!body) return "";
        if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
        return body;
    };

    try {
        const userCode = block.code.trim();
        if (!userCode) return null;

        // Fetch basic metadata for the context
        const reqHeaders = await readRequestHeaders();
        const resHeaders = await readResponseHeaders();
        const reqBody = await readRequestBody();
        const resBody = await readResponseBody();

        const context = {
            request: {
                headers: reqHeaders,
                body: reqBody
            },
            response: {
                headers: resHeaders,
                body: resBody
            },
            // Legacy/Helper access
            readRequestHeaders,
            readRequestBody,
            readResponseHeaders,
            readResponseBody
        };

        const wrappedCode = `
            return (async (context) => {
                try {
                    ${userCode}
                    if (typeof code === 'function') {
                        return await code();
                    }
                    return null;
                } catch (e) {
                    return { error: e.toString() };
                }
            })(context)
        `;

        const asyncFn = new Function('context', 'readRequestHeaders', 'readRequestBody', 'readResponseHeaders', 'readResponseBody', wrappedCode);
        const data = await asyncFn(context, readRequestHeaders, readRequestBody, readResponseHeaders, readResponseBody);

        if (block.type === 'html' && data && typeof data === 'object' && !data.error) {
            return `
                <style>${block.css || ''}</style>
                <script>window.DATA = ${JSON.stringify(data)};</script>
                ${block.html || ''}
            `;
        }
        return data;
    } catch (e: any) {
        return { error: e.toString() };
    }
};
