import { SelectionViewer } from "./SelectionViewer";
import { TrafficList } from "./TrafficList";

export const MainContent = () => (
  <div className="h-full w-full flex flex-col">
    <div className="flex-grow">
      <TrafficList />
    </div>
    <SelectionViewer />
  </div>
);
