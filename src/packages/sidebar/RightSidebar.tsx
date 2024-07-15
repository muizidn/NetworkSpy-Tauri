import { useState } from "react";

export const RightSidebar = () => {
    const [activeTab, setActiveTab] = useState("Duration");
  
    return (
      <div className="w-1/4 bg-gray-100 p-4">
        <div className="flex space-x-2 mb-4">
          {["Duration", "Path", "Host", "SSL"].map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? "btn-primary" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-content">
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
        </div>
      </div>
    );
  };
  