import { BottomPane } from "../../packages/bottom-pane/BottomPane";
import { FilterBar } from "../../packages/filter-bar/FilterBar";
import { MainContent } from "../../packages/main-content/MainContent";

export const CenterPane: React.FC = () => {
  return (
    <div className="flex flex-col">
      <FilterBar />
      <MainContent />
      <BottomPane />
    </div>
  );
};
