import { useMemo, useEffect } from "react";

export const ImageView = ({ data }: { data: Uint8Array }) => {
  const url = useMemo(() => {
    if (!data || data.length === 0) return "";
    const blob = new Blob([data as any]);
    return URL.createObjectURL(blob);
  }, [data]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url) return <div className="p-4 text-zinc-500 italic">No image data</div>;

  return <img src={url} alt="response" className="max-w-full max-h-full object-contain" />;
};
