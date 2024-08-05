import React from "react";

const ScriptEditor = () => {
  return (
    <div className='flex h-full bg-[#1d2022]'>
      <div className='w-[70%]'>
        <div className='border-b border-gray-300 p-4 space-y-2 h-[30vh]'>
          <p className=''>Matching Rule</p>
          <div className='border border-gray-300 rounded p-4 space-y-2 bg-[#242628]'>
            <div className='flex'>
              <div className='w-28'>
                <p className='text-sm text-right mr-3'>Name:</p>
              </div>
              <input
                type='text'
                className='input input-xs flex-grow rounded bg-[#474b49]'
                placeholder='Name'
              />
            </div>
            <div className='flex'>
              <div className='w-28'>
                <p className='text-sm text-right mr-3'>URL:</p>
              </div>
              <input
                type='text'
                className='input input-xs w-48 flex-grow rounded bg-[#474b49]'
                placeholder='URL'
              />
            </div>
            <div className='flex space-x-2 -ml-2'>
              <div className='w-28'></div>
              <select className='select select-xs border border-black rounded'>
                <option>ANY</option>
                <option>Starts with</option>
                <option>Ends with</option>
              </select>
              <select className='select select-xs border border-black rounded'>
                <option>Use Wildcard</option>
                <option>Starts with</option>
                <option>Ends with</option>
              </select>
              <p>Support wildcard * and ?.</p>
              <p className='underline'>Test your Rule</p>
            </div>
            <div className='flex space-x-2 -ml-2'>
              <div className='w-28'></div>
              <div className='flex'>
                <input type='checkbox' />
                <p className='ml-2'>Include all subpaths of this URL</p>
              </div>
            </div>
          </div>
          <div className='flex space-x-2'>
            <p>Run Script on:</p>
            <div className='flex'>
              <input type='checkbox' />
              <p className='ml-2'>Request</p>
            </div>
            <div className='flex'>
              <input type='checkbox' />
              <p className='ml-2'>Response</p>
            </div>
            <div className='flex'>
              <input type='checkbox' />
              <p className='ml-2'>Run as Mock API</p>
            </div>
          </div>
          <p>Save and Active!</p>
        </div>
        <div className='relative h-[70vh]'>
          <div className='absolute bottom-0 w-full flex items-center justify-between bg-[#272a2c] p-2 border-t border-gray-300'>
            <div className='flex space-x-2'>
              <select className='select select-xs border border-black rounded'>
                <option>More</option>
                <option>Starts with</option>
                <option>Ends with</option>
              </select>
              <button className='btn-xs bg-[#5c5e5f] rounded'>Console</button>
              <button className='btn-xs bg-[#5c5e5f] rounded'>
                Snippet Code
              </button>
            </div>
            <button className='btn-xs bg-[#5c5e5f] rounded'>
              Save & Activate
            </button>
          </div>
        </div>
      </div>
      <div className='w-[30%] border-l border-gray-300'></div>
    </div>
  );
};

export default ScriptEditor;
