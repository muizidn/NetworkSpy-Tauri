import { useState } from "react";

import { SelectionViewer } from "../main-content/SelectionViewer";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";
import { RequestResponseMode } from "./BottomPaneComponents/RequestResponseMode";
import { SummaryMode } from "./BottomPaneComponents/SummaryMode";
import { GraphQLMode } from "./BottomPaneComponents/GraphQLMode";
import { LLMPromptMode } from "./BottomPaneComponents/LLMPromptMode";
import { DiffMode } from "./BottomPaneComponents/DiffMode";
import { ReplayMode } from "./BottomPaneComponents/ReplayMode";
import { WebsocketMode } from "./BottomPaneComponents/WebsocketMode";
import { TimelineMode } from "./BottomPaneComponents/TimelineMode";
import { CompareMode } from "./BottomPaneComponents/CompareMode";
import { BatchAnalyzeMode } from "./BottomPaneComponents/BatchAnalyzeMode";
import { AISummaryMode } from "./BottomPaneComponents/AISummaryMode";

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