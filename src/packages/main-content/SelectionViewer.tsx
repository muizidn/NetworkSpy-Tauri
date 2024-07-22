export const SelectionViewer = () => {
  const tags = [{ title: "POST", color: "#FF0000" }];
  const url = "https://example.com/api/users?id=12345&page=1";

  return (
    <div className='flex flex-col border-t border-black'>
      <div id='url-viewer' className='border-b border-black'>
        <p className='select-text p-2 text-sm'>{url}</p>
      </div>
      <div className='flex border-b border-black'>
        {tags.map((e, i) => (
          <div
            key={`tag-${i}`}
            className='tag bg-red-500 rounded-full text-nowrap text-xs px-2 py-1 m-2'
            style={{ backgroundColor: e.color }}>
            {e.title}
          </div>
        ))}
      </div>
    </div>
  );
};
