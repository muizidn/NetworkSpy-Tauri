import { useState } from "react";

import { SelectionViewer } from "../main-content/SelectionViewer";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";
import { RequestResponseMode } from "./BottomPaneComponents/Single/RequestResponseMode";
import { SummaryMode } from "./BottomPaneComponents/None/SummaryMode";
import { GraphQLMode } from "./BottomPaneComponents/Single/GraphQLMode";
import { LLMPromptMode } from "./BottomPaneComponents/Single/LLMPromptMode";
import { DiffMode } from "./BottomPaneComponents/Single/DiffMode";
import { ReplayMode } from "./BottomPaneComponents/Single/ReplayMode";
import { WebsocketMode } from "./BottomPaneComponents/Single/WebsocketMode";
import { TimelineMode } from "./BottomPaneComponents/Multiple/TimelineMode";
import { CompareMode } from "./BottomPaneComponents/Multiple/CompareMode";
import { BatchAnalyzeMode } from "./BottomPaneComponents/Multiple/BatchAnalyzeMode";
import { AISummaryMode } from "./BottomPaneComponents/Multiple/AISummaryMode";

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