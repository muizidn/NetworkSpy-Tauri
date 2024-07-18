import { Header } from "../../packages/header/Header";
import { LeftSidebar } from "../../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../../packages/sidebar/RightSidebar";
import { NSTabs } from "../../packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";

const App = () => {
  return (
    <div className='flex flex-col h-screen'>
      <Header />
      <div className='flex flex-grow overflow-hidden'>
        <div className='w-[18%]'>
          <LeftSidebar />
        </div>
        <div className='w-[64%]'>
          <NSTabs
            tabs={[
              {
                id: "1",
                title: "Facebook API",
                content: <CenterPane />,
              },
              {
                id: "2",
                title: "Local Webserver Test",
                content: <CenterPane />,
              },
            ]}
          />
        </div>
        <div className='w-[18%]'>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default App;
