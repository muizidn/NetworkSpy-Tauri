import { TrafficList } from "./TrafficList";

export const MainContent: React.FC = () => (
  <div className="h-full w-full flex flex-col">
    <div className="flex-grow overflow-auto">
      <TrafficList />
    </div>
  </div>
);
