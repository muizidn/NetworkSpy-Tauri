import React from "react";

export const FilterBar = () => {
  return (
    <div className='bg-[#202020] text-white flex flex-col w-full'>
      <div className='flex items-center space-x-1 border-y border-gray-400 py-1 px-2'>
        <button className='btn btn-xs bg-[#353737] rounded text-white'>
          + Create New
        </button>
        <div className='flex space-x-1'>
          {[
            "All",
            "HTTP",
            "HTTPS",
            "Mozzlog User API",
            "Login Protobuf API",
          ].map((tab, index) => {
            return (
              <button
                key={index}
                className='btn btn-xs bg-[#353737] rounded text-white'>
                {tab}
              </button>
            );
          })}
        </div>
      </div>
      <div className='flex space-x-2 w-full p-2 border-b border-gray-400'>
        <input type='checkbox' />
        <select className='select select-sm border border-white rounded'>
          <option>URL</option>
          <option>Starts with</option>
          <option>Ends with</option>
        </select>
        <select className='select select-sm  border border-white rounded'>
          <option>Contains</option>
          <option>Starts with</option>
          <option>Ends with</option>
        </select>
        <input
          type='text'
          className='input input-sm w-48 flex-grow rounded'
          placeholder='URL'
        />

        <button className='btn btn-sm bg-[#1b64a5] rounded text-white'>
          -
        </button>
        <button className='btn btn-sm bg-[#1b64a5] rounded text-white'>
          +
        </button>
      </div>
    </div>
  );
};
