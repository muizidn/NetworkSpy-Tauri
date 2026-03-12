import React, { createContext, useContext, useState } from "react";

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
    | "request_response"
    | "graphql"
    | "llm_prompt"
    | "diff"
    | "replay"
    | "websocket"
    | "headers"
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
    | "ts_viewer";

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
    | "ai_security";

/**
 * Unified bottom pane mode.
 */
export type BottomPaneMode =
    | NoneMode
    | SingleMode
    | MultipleMode;

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