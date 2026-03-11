import SplitPane, { Pane, SashContent } from "split-pane-react";
import { useState } from "react";

import { RequestPairData, RequestTab } from "./RequestTab";
import { ResponseTab } from "./ResponseTab";
import { SelectionViewer } from "../main-content/SelectionViewer";
import { useSettingsContext } from "../../context/SettingsProvider";
import { invoke } from "@tauri-apps/api";
import { TauriEnvironment } from "../tauri/TauriEnvironment";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";

export const BottomPane = () => {
  const { mode } = useBottomPaneContext();
  const [sizes, setSizes] = useState<any[]>(["50%", "50%"]);

  return (
    <div className="flex flex-col w-full relative h-full">
      <SelectionViewer />

      {renderMode(mode, sizes, setSizes)}
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

    case "request_response":
      return <RequestResponseMode sizes={sizes} setSizes={setSizes} />;

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

    case "compare":
      return <CompareMode />;

    case "batch_analyze":
      return <BatchAnalyzeMode />;

    case "ai_summary":
      return <AISummaryMode />;

    default:
      return null;
  }
};

const RequestResponseMode = ({
  sizes,
  setSizes,
}: {
  sizes: any[];
  setSizes: (sizes: any[]) => void;
}) => {
  return (
    <div className="h-full">
      <SplitPane
        split="vertical"
        sashRender={() => <SashContent type="vscode" />}
        sizes={sizes}
        onChange={setSizes}
      >
        <Pane minSize="20%" maxSize="80%">
          <div className="h-full no-scrollbar flex items-center justify-center overflow-auto">
            <TauriEnvironment>
              <RequestTab
                loadData={(traffic) =>
                  invoke<RequestPairData>("get_request_pair_data", {
                    trafficId: traffic.id as string,
                  })
                }
              />
            </TauriEnvironment>
          </div>
        </Pane>

        <div className="h-full no-scrollbar flex items-center justify-center overflow-auto border-l border-black">
          <TauriEnvironment>
            <ResponseTab
              loadData={(traffic) =>
                invoke<RequestPairData>("get_response_pair_data", {
                  trafficId: traffic.id as string,
                })
              }
            />
          </TauriEnvironment>
        </div>
      </SplitPane>
    </div>
  );
};

const SummaryMode = () => {
  return (
    <div className="h-full border border-blue-500 flex items-center justify-center">
      TRAFFIC SUMMARY / ANALYTICS
    </div>
  );
};

const GraphQLMode = () => {
  return <div className="h-full border border-white">GRAPHQL VIEWER</div>;
};

const LLMPromptMode = () => {
  return <div className="h-full border border-green-500">LLM PROMPT VIEWER</div>;
};

const DiffMode = () => {
  return <div className="h-full border border-yellow-500">DIFF VIEWER</div>;
};

const ReplayMode = () => {
  return <div className="h-full border border-purple-500">REPLAY VIEWER</div>;
};

const WebsocketMode = () => {
  return <div className="h-full border border-cyan-500">WEBSOCKET VIEWER</div>;
};

const TimelineMode = () => {
  return <div className="h-full border border-red-500">TIMELINE VIEWER</div>;
};

const CompareMode = () => {
  return <div className="h-full border border-orange-500">COMPARE VIEWER</div>;
};

const BatchAnalyzeMode = () => {
  return (
    <div className="h-full border border-pink-500">BATCH ANALYZE VIEWER</div>
  );
};

const AISummaryMode = () => {
  return <div className="h-full border border-teal-500">AI SUMMARY VIEWER</div>;
};