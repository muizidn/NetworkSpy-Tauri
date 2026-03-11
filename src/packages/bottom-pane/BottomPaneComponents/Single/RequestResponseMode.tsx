import SplitPane, { Pane, SashContent } from "split-pane-react";
import { useAppProvider } from "@src/packages/app-env";
import { RequestTab } from "../../RequestTab";
import { ResponseTab } from "../../ResponseTab";

export const RequestResponseMode = ({
  sizes,
  setSizes,
}: {
  sizes: any[];
  setSizes: (sizes: any[]) => void;
}) => {
  const { provider } = useAppProvider();

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
            <RequestTab
              loadData={(traffic) =>
                provider.getRequestPairData(traffic.id as string)
              }
            />
          </div>
        </Pane>

        <div className="h-full no-scrollbar flex items-center justify-center overflow-auto border-l border-black">
          <ResponseTab
            loadData={(traffic) =>
              provider.getResponsePairData(traffic.id as string)
            }
          />
        </div>
      </SplitPane>
    </div>
  );
};
