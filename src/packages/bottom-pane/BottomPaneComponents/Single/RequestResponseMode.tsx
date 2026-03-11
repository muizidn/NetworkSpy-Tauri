import SplitPane, { Pane, SashContent } from "split-pane-react";
import { invoke } from "@tauri-apps/api";
import { RequestPairData, RequestTab } from "../../RequestTab";
import { ResponseTab } from "../../ResponseTab";
import { TauriEnvironment } from "../../../tauri/TauriEnvironment";

export const RequestResponseMode = ({
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
