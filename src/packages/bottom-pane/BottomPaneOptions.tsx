import { Button } from "../ui/Button";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";

export const BottomPaneOptions = () => {
  const { setMode, selectionType } = useBottomPaneContext();

  const optionsBySelection = {
    none: [
      { title: "Summary", onClick: () => setMode("summary") },
    ],

    single: [
      { title: "Request Response", onClick: () => setMode("request_response") },
      { title: "GraphQL", onClick: () => setMode("graphql") },
      { title: "LLM Prompt", onClick: () => setMode("llm_prompt") },
      { title: "Diff", onClick: () => setMode("diff") },
      { title: "Replay", onClick: () => setMode("replay") },
      { title: "WebSocket", onClick: () => setMode("websocket") },
    ],

    multiple: [
      { title: "Timeline", onClick: () => setMode("timeline") },
      { title: "Compare", onClick: () => setMode("compare") },
      { title: "Batch Analyze", onClick: () => setMode("batch_analyze") },
      { title: "AI Summary", onClick: () => setMode("ai_summary") },
    ],
  } as const;

  const options = optionsBySelection[selectionType];

  return (
    <div className="flex px-2 py-1 border-y border-black gap-2 flex-wrap">
      {options.map((opt, i) => (
        <Button key={`bottom-pane-option-${i}`} {...opt} />
      ))}
    </div>
  );
};