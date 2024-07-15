import { BottomPaneOptions } from "./BottomPaneOptions";
import { RequestTab } from "./RequestTab";
import { ResponseTab } from "./ResponseTab";

export const BottomPane = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-grow overflow-hidden">
        <RequestTab />
        <ResponseTab />
      </div>
      <BottomPaneOptions />
    </div>
  );
};
