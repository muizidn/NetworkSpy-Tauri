import { useState, Suspense } from "react";

import { SelectionViewer } from "../main-content/SelectionViewer";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { RequestResponseMode } from "./BottomPaneComponents/Single/RequestResponseMode";
import { SummaryMode } from "./BottomPaneComponents/None/SummaryMode";
import { HealthTimelineMode } from "./BottomPaneComponents/None/HealthTimelineMode";
import { StatusDistributionMode } from "./BottomPaneComponents/None/StatusDistributionMode";
import { MethodDistributionMode } from "./BottomPaneComponents/None/MethodDistributionMode";
import { GraphQLMode } from "./BottomPaneComponents/Single/GraphQLMode";
import { LLMPromptMode } from "./BottomPaneComponents/Single/LLMPromptMode";
import { DiffMode } from "./BottomPaneComponents/Single/DiffMode";
import { ReplayMode } from "./BottomPaneComponents/Single/ReplayMode";
import { WebsocketMode } from "./BottomPaneComponents/Single/WebsocketMode";
import { TimelineMode } from "./BottomPaneComponents/Multiple/TimelineMode";
import { CompareMode } from "./BottomPaneComponents/Multiple/CompareMode";
import { BatchAnalyzeMode } from "./BottomPaneComponents/Multiple/BatchAnalyzeMode";
import { AISummaryMode } from "./BottomPaneComponents/Multiple/AISummaryMode";
import { HeadersMode } from "./BottomPaneComponents/Single/HeadersMode";
import { JSONTreeMode } from "./BottomPaneComponents/Single/JSONTreeMode";
import { CurlMode } from "./BottomPaneComponents/Single/CurlMode";
import { CodeSnippetMode } from "./BottomPaneComponents/Single/CodeSnippetMode";
import { SensitiveDataMode } from "./BottomPaneComponents/Single/SensitiveDataMode";
import { AuthAnalysisMode } from "./BottomPaneComponents/Single/AuthAnalysisMode";
import { AIDebugMode } from "./BottomPaneComponents/Single/AIDebugMode";
import { AITestMode } from "./BottomPaneComponents/Single/AITestMode";
import { PerformanceMode } from "./BottomPaneComponents/Multiple/PerformanceMode";
import { WaterfallMode } from "./BottomPaneComponents/Multiple/WaterfallMode";
import { EndpointSummaryMode } from "./BottomPaneComponents/Multiple/EndpointSummaryMode";
import { SecurityScanMode } from "./BottomPaneComponents/Multiple/SecurityScanMode";
import { AIInvestigateMode } from "./BottomPaneComponents/Multiple/AIInvestigateMode";
import { AISecurityMode } from "./BottomPaneComponents/Multiple/AISecurityMode";
import { JWTDecoderMode } from "./BottomPaneComponents/Single/JWTDecoderMode";
import { LLMStreamingMode } from "./BottomPaneComponents/Single/LLMStreamingMode";
import { SSEViewerMode } from "./BottomPaneComponents/Single/SSEViewerMode";
import { LLMResponseMode } from "./BottomPaneComponents/Single/LLMResponseMode";
import { LLMTokenAnalyzerMode } from "./BottomPaneComponents/Single/LLMTokenAnalyzerMode";
import { useTrafficListContext } from "../main-content/context/TrafficList";

export const BottomPane = () => {
  const { mode } = useBottomPaneContext();
  const [sizes, setSizes] = useState<any[]>(["50%", "50%"]);
  const { selections } = useTrafficListContext();

  return (
    <div className="flex flex-col w-full relative h-full">
      {selections.firstSelected && <SelectionViewer />}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-zinc-600 italic text-xs animate-pulse">
            Loading viewer...
          </div>
        }>
          {renderMode(mode, sizes, setSizes)}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

const renderMode = (
  mode: string,
  sizes: any[],
  setSizes: (sizes: any[]) => void
) => {
  switch (mode) {
    case "summary":
      return <SummaryMode />;

    case "health_timeline":
      return <HealthTimelineMode />;

    case "status_distribution":
      return <StatusDistributionMode />;

    case "method_distribution":
      return <MethodDistributionMode />;

    case "request_response":
      return <RequestResponseMode sizes={sizes} setSizes={setSizes} />;

    case "headers":
      return <HeadersMode />;

    case "json_tree":
      return <JSONTreeMode />;

    case "curl":
      return <CurlMode />;

    case "code_snippet":
      return <CodeSnippetMode />;

    case "sensitive_data":
      return <SensitiveDataMode />;

    case "auth_analysis":
      return <AuthAnalysisMode />;

    case "ai_debug":
      return <AIDebugMode />;

    case "ai_test":
      return <AITestMode />;

    case "graphql":
      return <GraphQLMode />;

    case "llm_prompt":
      return <LLMPromptMode />;

    case "diff":
      return <DiffMode />;

    case "replay":
      return <ReplayMode />;

    case "websocket":
      return <WebsocketMode />;

    case "timeline":
      return <TimelineMode />;

    case "waterfall":
      return <WaterfallMode />;

    case "compare":
      return <CompareMode />;

    case "performance":
      return <PerformanceMode />;

    case "endpoint_summary":
      return <EndpointSummaryMode />;

    case "batch_analyze":
      return <BatchAnalyzeMode />;

    case "security_scan":
      return <SecurityScanMode />;

    case "ai_summary":
      return <AISummaryMode />;

    case "ai_investigate":
      return <AIInvestigateMode />;

    case "ai_security":
      return <AISecurityMode />;

    case "jwt_decoder":
      return <JWTDecoderMode />;

    case "llm_streaming":
      return <LLMStreamingMode />;

    case "sse_viewer":
      return <SSEViewerMode />;

    case "llm_response":
      return <LLMResponseMode />;

    case "llm_token_analyzer":
      return <LLMTokenAnalyzerMode />;

    default:
      return null;
  }
};