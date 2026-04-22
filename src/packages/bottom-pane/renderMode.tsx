import { BottomPaneMode } from "@src/context/BottomPaneContext";
import { RequestResponseMode } from "./BottomPaneComponents/Single/RequestResponseMode";
import { SummaryMode } from "./BottomPaneComponents/None/SummaryMode";
import { HealthTimelineMode } from "./BottomPaneComponents/None/HealthTimelineMode";
import { StatusDistributionMode } from "./BottomPaneComponents/None/StatusDistributionMode";
import { MethodDistributionMode } from "./BottomPaneComponents/None/MethodDistributionMode";
import { GraphQLMode } from "./BottomPaneComponents/Single/GraphQLMode";
import { LLMPromptMode } from "./BottomPaneComponents/Single/LLMPromptMode";
import { DiffMode } from "./BottomPaneComponents/Multiple/DiffMode";
import { OWASPMode } from "./BottomPaneComponents/Single/OWASPMode";
import { MobSFMode } from "./BottomPaneComponents/Single/MobSFMode";
import { StaticSecurityMode } from "./BottomPaneComponents/Single/StaticSecurityMode";
import { ReplayMode } from "./BottomPaneComponents/Single/ReplayMode";
import { WebsocketMode } from "./BottomPaneComponents/Single/WebsocketMode";
import { TimelineMode } from "./BottomPaneComponents/Multiple/TimelineMode";
import { CompareMode } from "./BottomPaneComponents/Multiple/CompareMode";
import { BatchAnalyzeMode } from "./BottomPaneComponents/Multiple/BatchAnalyzeMode";
import { AISummaryMode } from "./BottomPaneComponents/Multiple/AISummaryMode";
import { HeaderExplainerMode } from "./BottomPaneComponents/Single/HeaderExplainerMode";
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
import { HexViewerMode } from "./BottomPaneComponents/Single/HexViewerMode";
import { ImageViewerMode } from "./BottomPaneComponents/Single/ImageViewerMode";
import { HTMLViewerMode } from "./BottomPaneComponents/Single/HTMLViewerMode";
import { XMLViewerMode } from "./BottomPaneComponents/Single/XMLViewerMode";
import { AudioViewerMode } from "./BottomPaneComponents/Single/AudioViewerMode";
import { VideoViewerMode } from "./BottomPaneComponents/Single/VideoViewerMode";
import { SourceViewerMode } from "./BottomPaneComponents/Single/SourceViewerMode";
import { JSONTransformerMode } from "./BottomPaneComponents/Single/JSONTransformerMode";
import { JSONSchemaMode } from "./BottomPaneComponents/Single/JSONSchemaMode";
import { SOAPViewerMode } from "./BottomPaneComponents/Single/Protocols/SOAPViewerMode";
import { ProtobufViewerMode } from "./BottomPaneComponents/Single/Protocols/ProtobufViewerMode";
import { GRPCViewerMode } from "./BottomPaneComponents/Single/Protocols/GRPCViewerMode";
import { RabbitMQViewerMode } from "./BottomPaneComponents/Single/Protocols/RabbitMQViewerMode";
import { KafkaViewerMode } from "./BottomPaneComponents/Single/Protocols/KafkaViewerMode";
import { QueryParamsMode } from "./BottomPaneComponents/Single/QueryParamsMode";
import { CookieViewerMode } from "./BottomPaneComponents/Single/CookieViewerMode";
import { FirebaseMode } from "./BottomPaneComponents/Single/FirebaseMode";
import { SupabaseMode } from "./BottomPaneComponents/Single/SupabaseMode";
import { AppwriteMode } from "./BottomPaneComponents/Single/AppwriteMode";
import { AdsViewerMode } from "./BottomPaneComponents/Single/AdsViewerMode";
import { MultipartFormDataMode } from "./BottomPaneComponents/Single/MultipartFormDataMode";
import { URLEncodedMode } from "./BottomPaneComponents/Single/URLEncodedMode";
import { CustomViewerMode } from "@src/packages/bottom-pane/BottomPaneComponents/Single/CustomViewerMode";

export const renderMode = (
  mode: BottomPaneMode,
  sizes: any[],
  setSizes: (sizes: any[]) => void
) => {
  if (typeof mode === 'object' && mode.type === 'viewer') {
    return <CustomViewerMode viewerId={mode.id} />;
  }

  switch (mode) {
    case "custom_viewer":
      return <CustomViewerMode />;
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

    case "header_explainer":
      return <HeaderExplainerMode />;

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

    case "security_owasp":
      return <OWASPMode />;

    case "security_mobsf":
      return <MobSFMode />;

    case "security_static":
      return <StaticSecurityMode />;

    case "query_params":
      return <QueryParamsMode />;

    case "cookies":
      return <CookieViewerMode />;

    case "firebase_viewer":
      return <FirebaseMode />;

    case "supabase_viewer":
      return <SupabaseMode />;

    case "appwrite_viewer":
      return <AppwriteMode />;

    case "ads_viewer":
      return <AdsViewerMode />;

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

    case "hex_viewer":
      return <HexViewerMode />;

    case "image_viewer":
      return <ImageViewerMode />;

    case "html_viewer":
      return <HTMLViewerMode />;

    case "xml_viewer":
      return <XMLViewerMode />;

    case "audio_viewer":
      return <AudioViewerMode />;

    case "video_viewer":
      return <VideoViewerMode />;

    case "js_viewer":
      return <SourceViewerMode language="javascript" title="JavaScript" />;

    case "css_viewer":
      return <SourceViewerMode language="css" title="Stylesheet" />;

    case "ts_viewer":
      return <SourceViewerMode language="typescript" title="TypeScript" />;

    case "json_transformer":
      return <JSONTransformerMode />;

    case "json_schema":
      return <JSONSchemaMode />;

    case "soap_viewer":
      return <SOAPViewerMode />;

    case "protobuf_viewer":
      return <ProtobufViewerMode />;

    case "grpc_viewer":
      return <GRPCViewerMode />;

    case "rabbitmq_viewer":
      return <RabbitMQViewerMode />;

    case "kafka_viewer":
      return <KafkaViewerMode />;

    case "multipart_form":
      return <MultipartFormDataMode />;

    case "urlencoded":
      return <URLEncodedMode />;

    default:
      return null;
  }
};
