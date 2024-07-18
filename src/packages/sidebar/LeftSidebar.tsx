import Expand from "../../packages/ui/Sidebar/Expand";

export const LeftSidebar = () => {
  return (
    <div className='bg-[#23262a] p-4 border border-gray-400 h-full'>
      <h2 className='font-bold text-white'>All Traffic</h2>
      <ul>
        <li>
          <Expand text='App'>
            <ul>
              <li>App 1</li>
              <li>App 2</li>
            </ul>
          </Expand>
        </li>
        <li>
          <Expand text='Domain'>
            <ul>
              <li>Domain 1</li>
              <li>Domain 2</li>
            </ul>
          </Expand>
        </li>
      </ul>
    </div>
  );
};
