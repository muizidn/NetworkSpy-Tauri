import React, { createContext, useContext, useState } from "react";
import { ViewerMatcher } from "./ViewerContext";

import sseJs from "./builtin-matchers/sse.js?raw";
import graphqlHeaderJs from "./builtin-matchers/graphql-header.js?raw";
import graphqlBodyJs from "./builtin-matchers/graphql-body.js?raw";
import jsonJs from "./builtin-matchers/json.js?raw";
import imageJs from "./builtin-matchers/image.js?raw";
import htmlJs from "./builtin-matchers/html.js?raw";
import videoJs from "./builtin-matchers/video.js?raw";
import audioJs from "./builtin-matchers/audio.js?raw";
import jwtJs from "./builtin-matchers/jwt.js?raw";

/**
 * Mode when nothing is selected.
 * Shows global traffic summary / analytics.
 */
export type NoneMode =
    | "summary"
    | "health_timeline"
    | "status_distribution"
    | "method_distribution";

/**
 * Modes when a single traffic is selected.
 */
export type SingleMode =
    | "custom_viewer"
    | "request_response"
    | "graphql"
    | "llm_prompt"
    | "replay"
    | "websocket"
    | "header_explainer"
    | "json_tree"
    | "curl"
    | "code_snippet"
    | "sensitive_data"
    | "auth_analysis"
    | "ai_debug"
    | "ai_test"
    | "jwt_decoder"
    | "llm_streaming"
    | "sse_viewer"
    | "llm_response"
    | "llm_token_analyzer"
    | "hex_viewer"
    | "image_viewer"
    | "html_viewer"
    | "xml_viewer"
    | "audio_viewer"
    | "video_viewer"
    | "js_viewer"
    | "css_viewer"
    | "ts_viewer"
    | "soap_viewer"
    | "protobuf_viewer"
    | "grpc_viewer"
    | "rabbitmq_viewer"
    | "kafka_viewer"
    | "json_transformer"
    | "json_schema"
    | "security_owasp"
    | "security_mobsf"
    | "security_static"
    | "query_params"
    | "cookies"
    | "firebase_viewer"
    | "supabase_viewer"
    | "appwrite_viewer"
    | "ads_viewer"
    | "urlencoded"
    | "multipart_form";

/**
 * Modes when multiple traffics are selected.
 */
export type MultipleMode =
    | "timeline"
    | "compare"
    | "batch_analyze"
    | "ai_summary"
    | "performance"
    | "waterfall"
    | "endpoint_summary"
    | "security_scan"
    | "ai_investigate"
    | "ai_security"
    | "diff";

export type CustomSingleMode = { type: "viewer"; id: string };

/**
 * Unified bottom pane mode.
 */
export type BottomPaneMode =
    | NoneMode
    | SingleMode
    | MultipleMode
    | CustomSingleMode;

export type BottomPaneSelectionType =
    | "none"
    | "single"
    | "multiple";

interface BottomPaneContextType {
    mode: BottomPaneMode;
    setMode: React.Dispatch<React.SetStateAction<BottomPaneMode>>;

    selectionType: BottomPaneSelectionType;
    setSelectionType: React.Dispatch<
        React.SetStateAction<BottomPaneSelectionType>
    >;
}

const BottomPaneContext = createContext<BottomPaneContextType | undefined>(
    undefined
);

export const useBottomPaneContext = () => {
    const context = useContext(BottomPaneContext);

    if (!context) {
        throw new Error(
            "useBottomPaneContext must be used within BottomPaneProvider"
        );
    }

    return context;
};

export const BottomPaneProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [mode, setMode] = useState<BottomPaneMode>("summary");
    const [selectionType, setSelectionType] =
        useState<BottomPaneSelectionType>("none");

    return (
        <BottomPaneContext.Provider
            value={{
                mode,
                setMode,
                selectionType,
                setSelectionType,
            }}
        >
            {children}
        </BottomPaneContext.Provider>
    );
};

export const builtinMatchers: Record<string, ViewerMatcher[]> = {
    sse_viewer: [
        { js: sseJs }
    ],
    graphql: [
        { js: graphqlHeaderJs },
        { js: graphqlBodyJs },
        { glob: "*graphql*" },
        { glob: "*/graphql" }
    ],
    json_tree: [
        { js: jsonJs }
    ],
    image_viewer: [
        { js: imageJs }
    ],
    html_viewer: [
        { js: htmlJs }
    ],
    video_viewer: [
        { js: videoJs }
    ],
    audio_viewer: [
        { js: audioJs }
    ],
    jwt_decoder: [
        { js: jwtJs }
    ]
};