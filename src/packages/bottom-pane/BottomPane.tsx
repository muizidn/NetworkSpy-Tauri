import { useState, Suspense } from "react";

import { SelectionViewer } from "../main-content/SelectionViewer";
import { useBottomPaneContext, BottomPaneMode } from "@src/context/BottomPaneContext";
import { ErrorBoundary } from "../ui/ErrorBoundary";
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
import { CustomViewerMode } from "@src/packages/bottom-pane/BottomPaneComponents/Single/CustomViewerMode";

import { useTrafficListContext } from "../main-content/context/TrafficList";
import { useAppProvider } from "../app-env";
import { FiShield, FiLock, FiUnlock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { Dialog } from "../ui/Dialog";

import { ContainerQueryProvider } from "@src/context/ContainerQueryContext";

export const BottomPane = () => {
  const { mode, selectionType } = useBottomPaneContext();
  const [sizes, setSizes] = useState<any[]>(["50%", "50%"]);
  const { selections } = useTrafficListContext();
  const { provider } = useAppProvider();
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const selected = selections.firstSelected;

  const handleIntercept = async () => {
    if (!selected || !selected.url) return;
    try {
      setIsIntercepting(true);
      const url = new URL(selected.url as string);
      const domain = url.hostname;
      await provider.updateInterceptAllowList([domain]);
      setDialogConfig({
        isOpen: true,
        title: 'Interception Updated',
        message: `Domain ${domain} has been added to the interception allow-list. Future traffic will be decrypted.`,
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setDialogConfig({
        isOpen: true,
        title: 'Update Failed',
        message: "Failed to update interception settings. Please check console for details.",
        type: 'error'
      });
    } finally {
      setIsIntercepting(false);
    }
  };

  const handleInterceptAll = async () => {
    if (!selections.others) return;
    try {
      setIsIntercepting(true);
      const tunneledDomains = Array.from(new Set(
        selections.others
          .filter(t => t && !t.intercepted && t.url)
          .map(t => {
            try { return new URL(t.url as string).hostname; } catch { return null; }
          })
          .filter(Boolean) as string[]
      ));

      if (tunneledDomains.length === 0) return;

      await provider.updateInterceptAllowList(tunneledDomains);
      setDialogConfig({
        isOpen: true,
        title: 'Batch Update Successful',
        message: `Successfully added ${tunneledDomains.length} domains to the interception allow-list.`,
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setDialogConfig({
        isOpen: true,
        title: 'Batch Update Failed',
        message: "Failed to process batch update.",
        type: 'error'
      });
    } finally {
      setIsIntercepting(false);
    }
  };

  const isMultiple = selectionType === "multiple";
  const tunneledCount = selections.others ? selections.others.filter(t => t && !t.intercepted).length : 0;
  const interceptedCount = selections.others ? selections.others.filter(t => t && t.intercepted).length : 0;

  return (
    <div className="flex flex-col w-full relative h-full">
      {selections.firstSelected && <SelectionViewer />}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-zinc-600 italic text-xs animate-pulse">
            Loading viewer...
          </div>
        }>
          <div className="flex-grow overflow-y-auto h-full custom-scrollbar bg-[#111] pb-12 @container">
            <ContainerQueryProvider>
            {(() => {
              if (!selected) return renderMode(mode, sizes, setSizes);

              if (!isMultiple) {
                if (selected.intercepted) {
                  return renderMode(mode, sizes, setSizes);
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[#0a0a0a]">
                      <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl relative">
                        <FiLock size={48} className="text-zinc-600" />
                        <div className="absolute -bottom-1 -right-1 bg-red-500/20 text-red-400 p-1.5 rounded-full border border-red-500/30">
                          <FiShield size={16} />
                        </div>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-3 tracking-tight">ENCRYPTED TUNNEL</h2>
                      <p className="text-zinc-500 max-w-md text-sm leading-relaxed mb-10">
                        Traffic to <span className="text-zinc-300 font-mono font-bold">{new URL(selected.url as string).hostname}</span> is currently being tunneled directly to ensure privacy. Deep inspection is disabled.
                      </p>
                      <button
                        onClick={handleIntercept}
                        disabled={isIntercepting}
                        className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-purple-900/40 uppercase tracking-tight"
                      >
                        <FiUnlock size={18} />
                        {isIntercepting ? "Wait..." : "Enable Interception for this host"}
                      </button>
                    </div>
                  );
                }
              }

              return renderMode(mode, sizes, setSizes);
            })()}
            </ContainerQueryProvider>
          </div>
        </Suspense>
      </ErrorBoundary>

      {/* Interception Overlay/Bar */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/90 border-t border-zinc-800 p-2.5 px-6 flex items-center justify-between backdrop-blur-xl z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            {isMultiple ? (
              <div className="flex items-center gap-4 border-r border-zinc-800 pr-5 mr-1">
                <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                  <span>{tunneledCount} Tunneled</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  <span>{interceptedCount} Intercepted</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {selected.intercepted ? (
                  <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-widest">
                    <FiUnlock size={14} className="animate-pulse" />
                    <span>Interception Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                    <FiLock size={14} />
                    <span>Tunneled Connection</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {(isMultiple ? tunneledCount > 0 : !selected.intercepted) && (
            <button
              onClick={isMultiple ? handleInterceptAll : handleIntercept}
              disabled={isIntercepting}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <FiShield size={12} />
              {isIntercepting ? "PROVISIONING..." : isMultiple ? `INTERCEPT ${tunneledCount} HOSTS` : "INTERCEPT HOST"}
            </button>
          )}
        </div>
      )}

      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />
    </div>
  );
};

const renderMode = (
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

    default:
      return null;
  }
};