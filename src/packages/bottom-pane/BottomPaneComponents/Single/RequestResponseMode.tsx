import SplitPane, { Pane, SashContent } from "split-pane-react";
import { useAppProvider } from "@src/packages/app-env";
import { RequestTab } from "../../RequestTab";
import { ResponseTab } from "../../ResponseTab";
import { useIsMobile } from "../../../../hooks/useMobile";

export const RequestResponseMode = ({
  sizes,
  setSizes,
}: {
  sizes: any[];
  setSizes: (sizes: any[]) => void;
}) => {
  const { provider } = useAppProvider();
  const isMobile = useIsMobile();

  return (
    <div className="h-full">
      <SplitPane
        split={isMobile ? "horizontal" : "vertical"}
        sashRender={() => <SashContent type="vscode" />}
        sizes={sizes}
        onChange={setSizes}
      >
        <Pane minSize={isMobile ? "30%" : "20%"} maxSize={isMobile ? "70%" : "80%"}>
          <div className="h-full no-scrollbar flex items-center justify-center overflow-auto">
            <RequestTab
              loadData={(traffic) =>
                provider.getRequestPairData(traffic.id as string)
              }
            />
          </div>
        </Pane>

        <div className="h-full no-scrollbar flex items-center justify-center overflow-auto border-l border-zinc-900 border-t @sm:border-t-0 @sm:border-l">
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
