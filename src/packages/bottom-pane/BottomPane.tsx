import { BottomPaneOptions } from "./BottomPaneOptions";
import { RequestTab } from "./RequestTab";
import { ResponseTab } from "./ResponseTab";

export const BottomPane = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-grow">
        <div className="w-1/2">
          <RequestTab />
        </div>
        <div className="w-1/2">
          <ResponseTab />
        </div>
      </div>
      <BottomPaneOptions />
    </div>
  );
};
