import { Button } from "../ui/Button";

export const BottomPaneOptions = () => {
  const options = [
    { title: "+ New Viewer", onClick: () => alert("Ok") },
    { title: "Request Response", onClick: () => alert("Ok") },
  ];

  return (
    <div className='flex px-2 py-1 border-y border-black'>
      <button className='btn btn-xs bg-[#333333] rounded'>
        + Add New Viewer
      </button>

      {options.map((e, i) => (
        <Button key={`button-options-${i}`} {...e} />
      ))}
    </div>
  );
};
