import { useState } from "react";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState("Duration");

  return (
    <div className='w-full h-full bg-[#23262a] border-x border-b border-gray-400 overflow-block'>
      <div className='block mb-4 bg-[#15181a]'>
        {["Path", "Host", "SSL", "Duration", "Hex"].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm rounded text-xs bg-[#23262a] ${
              activeTab === tab ? "text-red-400" : "text-white "
            }`}
            onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <div className='tab-content p-4'>
        {activeTab === "Duration" && (
          <div>
            <p>Current Duration: 2.15 seconds</p>
            <p>Average Duration: 2.1 seconds</p>
            <p>Fastest Duration: 1.9 seconds</p>
            <p>Slowest Duration: 3.87 seconds</p>
            <p>Stats: Slow Duration (47%), Fast Duration (53%)</p>
          </div>
        )}
        {activeTab === "Path" && <div>Path Content</div>}
        {activeTab === "Host" && <div>Host Content</div>}
        {activeTab === "SSL" && <div>SSL Content</div>}
        {activeTab === "Hex" && <div>Hex Content</div>}
      </div>
    </div>
  );
};
