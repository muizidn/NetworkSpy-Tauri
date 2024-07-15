export const SelectionViewer = () => {
  const tags = [{ title: "POST", color: "#FF0000" }];
  const url = "https://example.com/api/users?id=12345&page=1";

  return (
    <div className="flex flex-col p-2 space-y-2">
      <div id="url-viewer">{url}</div>
      <div className="flex">
        {tags.map((e, i) => (
          <div
            key={`tag-${i}`}
            className="rounded-full px-2 py-1"
            style={{ backgroundColor: e.color }}
          >
            {e.title}
          </div>
        ))}
      </div>
    </div>
  );
};
