import { BottomPane } from "../../packages/bottom-pane/BottomPane";
import { FilterBar } from "../../packages/filter-bar/FilterBar";
import { MainContent } from "../../packages/main-content/MainContent";

export const CenterPane: React.FC = () => {
  return (
    <div className='flex flex-col'>
      <div>
        <FilterBar />
      </div>
      <div className='h-[35vh] bg-[#23262a]'>
        <MainContent />
      </div>
      <div className='h-[60vh]'>
        <BottomPane />
      </div>
    </div>
  );
};
