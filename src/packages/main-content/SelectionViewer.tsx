import { useTrafficListContext } from "./context/TrafficList";

export const SelectionViewer = () => {
  const { selections } = useTrafficListContext();
  const tags = selections.firstSelected?.tags as string[] || [];
  const url = selections.firstSelected?.url as string || '';

  return (
    <div className='flex flex-col border-t border-black w-full'>
      <div id='url-viewer' className='border-b border-black w-full p-2'>
        <p className='select-text text-sm'>{url}</p>
      </div>
      <div className='flex border-b border-black'>
        {tags.map((e, i) => (
          <div
            key={`tag-${i}`}
            className='tag bg-red-500 rounded-full text-nowrap text-xs px-2 py-1 m-2'
            style={{ backgroundColor: 'red' }}>
            {e}
          </div>
        ))}
      </div>
    </div>
  );
};
