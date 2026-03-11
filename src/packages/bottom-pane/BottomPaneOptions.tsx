import { useEffect } from "react";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { Button } from "../ui/Button";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";

export const BottomPaneOptions = () => {
  const { setMode, selectionType, setSelectionType } = useBottomPaneContext();

  const { selections } = useTrafficListContext();

  useEffect(() => {
    if (!selections.firstSelected) {
      setSelectionType("none")
    }

    if (selections.firstSelected) {
      setSelectionType("single")
    }

    if (selections.others && selections.others.length > 1) {
      setSelectionType("multiple")
    }

  }, [selections])

  const optionsBySelection = {
    none: [
      { title: "Summary", onClick: () => setMode("summary") },
    ],

    single: [
      { title: "Request Response", onClick: () => setMode("request_response") },
      { title: "Headers", onClick: () => setMode("headers") },
      { title: "JSON Tree", onClick: () => setMode("json_tree") },
      { title: "cURL", onClick: () => setMode("curl") },
      { title: "Code Snippet", onClick: () => setMode("code_snippet") },
      { title: "Sensitive Data", onClick: () => setMode("sensitive_data") },
      { title: "Auth Analysis", onClick: () => setMode("auth_analysis") },
      { title: "AI Debug", onClick: () => setMode("ai_debug") },
      { title: "AI Test", onClick: () => setMode("ai_test") },
      { title: "GraphQL", onClick: () => setMode("graphql") },
      { title: "LLM Prompt", onClick: () => setMode("llm_prompt") },
      { title: "Diff", onClick: () => setMode("diff") },
      { title: "Replay", onClick: () => setMode("replay") },
      { title: "WebSocket", onClick: () => setMode("websocket") },
      { title: "JWT Decoder", onClick: () => setMode("jwt_decoder") },
    ],

    multiple: [
      { title: "Timeline", onClick: () => setMode("timeline") },
      { title: "Waterfall", onClick: () => setMode("waterfall") },
      { title: "Compare", onClick: () => setMode("compare") },
      { title: "Performance", onClick: () => setMode("performance") },
      { title: "Endpoint Summary", onClick: () => setMode("endpoint_summary") },
      { title: "Batch Analyze", onClick: () => setMode("batch_analyze") },
      { title: "Security Scan", onClick: () => setMode("security_scan") },
      { title: "AI Security", onClick: () => setMode("ai_security") },
      { title: "AI Summary", onClick: () => setMode("ai_summary") },
      { title: "AI Investigate", onClick: () => setMode("ai_investigate") },
    ],
  } as const;

  const options = optionsBySelection[selectionType];

  return (
    <div className="flex px-2 py-1 border-y border-black gap-2 overflow-x-scroll">
      {options.map((opt, i) => (
        <Button key={`bottom-pane-option-${i}`} {...opt} />
      ))}
    </div>
  );
};