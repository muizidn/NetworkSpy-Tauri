import { Button } from "../ui/Button";

export const BottomPaneOptions = () => {
  const options = [
    { title: "+ New Viewer", onClick: () => alert("Ok") },
    { title: "Request Response", onClick: () => alert("Ok") },
  ];

  return (
    <div className="flex">
      <button className="btn btn-sm">+ Add New Viewer</button>

      {options.map((e, i) => (
        <Button key={`button-options-${i}`} {...e} />
      ))}
    </div>
  );
};
