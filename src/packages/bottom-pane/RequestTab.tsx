export const RequestTab = () => (
  <div className="flex p-2 bg-gray-800 text-white border">
    <h3>Request</h3>
    <div className="flex space-x-2">
      {["Header", "Auth", "Raw", "Body", "Comment"].map((tab) => (
        <button key={tab} className="btn btn-sm">
          {tab}
        </button>
      ))}
    </div>
  </div>
);
