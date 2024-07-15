import React from "react";

export const FilterBar = () => {
  return (
    <div className="bg-gray-800 text-white p-2 flex flex-col w-full">
      <div className="flex items-center space-x-2">
        <button className="btn btn-sm">+ Create New</button>
        <div className="flex space-x-1">
          {["All", "HTTP", "HTTPS", "Mozzlog User API", "Login Protobuf API"].map((tab, index) => {
              return (
                  <button
                      key={index}
                      className="btn btn-xs"
                  >
                      {tab}
                  </button>
              );
          })}
        </div>
      </div>
      <div className="flex space-x-2 w-full">
        <input
          type="text"
          className="input input-sm w-48 flex-grow"
          placeholder="URL"
        />
        <select className="select select-sm">
          <option>Contains</option>
          <option>Starts with</option>
          <option>Ends with</option>
        </select>
        <button className="btn btn-xs">-</button>
        <button className="btn btn-xs">+</button>
      </div>
    </div>
  );
};
