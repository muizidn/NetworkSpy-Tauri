import { SelectionViewer } from "./SelectionViewer";
import { TableView } from "./TableView";

export const MainContent = () => (
  <div className="h-full w-full flex flex-col">
    <div className="flex-grow">
      <TableView />
    </div>
    <SelectionViewer />
  </div>
);
