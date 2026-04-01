import { useState } from "react";
import { useTrafficListContext } from "./context/TrafficList";
import { twMerge } from "tailwind-merge";
import { FiExternalLink, FiGlobe, FiClock, FiBox, FiShield, FiLock, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { useTagContext } from "@src/context/TagContext";

const CustomTag = ({ tagName }: { tagName: string }) => {
  const { tags } = useTagContext();
  const tagModel = tags.find(t => t.tag === tagName);

  return (
    <div
      className='px-2 py-0.5 rounded-full border border-current text-[10px] font-bold leading-none transition-colors cursor-default opacity-90'
      style={{
        color: tagModel?.color || '#60a5fa',
        backgroundColor: tagModel?.bgColor || '#3b82f61a',
        borderColor: `${tagModel?.color || '#60a5fa'}33`
      }}
    >
      {tagName}
    </div>
  );
};

const UrlColorizer = ({ url, intercepted }: { url: string; intercepted?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!url) return null;

  const isLong = url.length > 100;

  try {
    const urlObj = new URL(url);
    const params = Array.from(urlObj.searchParams.entries());
    const displayParams = isLong && !isExpanded ? params.slice(0, 3) : params;

    return (
      <div className="font-mono text-[13px] leading-relaxed break-words select-text">
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={twMerge(
              "inline-flex items-center justify-center w-5 h-5 mr-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors align-middle text-zinc-400 group relative",
              !isExpanded && "animate-button-pulse border border-purple-500/30"
            )}
            title={isExpanded ? "Collapse URL" : "Expand URL"}
          >
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        )}

        {intercepted && (
          <FiShield
            size={12}
            className="inline mr-1 text-purple-400 align-middle"
            title="Intercepted (Decrypted)"
          />
        )}

        <span className="text-zinc-500 font-bold">
          {urlObj.protocol}//
        </span>

        <button
          onClick={() => window.open(url, "_blank")}
          className="inline items-center gap-1 text-blue-400 font-bold hover:underline hover:text-blue-300 transition-colors group"
          title="Open in Browser"
        >
          {urlObj.hostname}

          {urlObj.port && (
            <span className="text-zinc-500">:{urlObj.port}</span>
          )}

          <FiExternalLink
            size={10}
            className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>

        <span className="text-zinc-300">
          {isLong && !isExpanded ? urlObj.pathname.substring(0, 30) + (urlObj.pathname.length > 30 ? "..." : "") : urlObj.pathname}
        </span>

        {displayParams.length > 0 && (
          <>
            <span className="text-zinc-500">?</span>

            {displayParams.map(([key, value], i) => (
              <span key={i}>
                <span className="text-orange-400">{key}</span>
                <span className="text-zinc-500">=</span>
                <span className="text-green-400">
                  {isLong && !isExpanded ? value.substring(0, 20) + (value.length > 20 ? "..." : "") : value}
                </span>

                {i < displayParams.length - 1 && (
                  <span className="text-zinc-500">&</span>
                )}
              </span>
            ))}
            
            {isLong && !isExpanded && params.length > 3 && (
              <span className="text-zinc-500 ml-1">...(+{params.length - 3} more)</span>
            )}
          </>
        )}
      </div>
    );
  } catch {
    const displayUrl = isLong && !isExpanded ? `${url.substring(0, 100)}...` : url;
    return (
      <div className="font-mono text-[13px] leading-relaxed break-words select-text flex items-start group">
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={twMerge(
              "flex-shrink-0 inline-flex items-center justify-center w-5 h-5 mr-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors align-middle text-zinc-400 mt-0.5",
              !isExpanded && "animate-button-pulse border border-purple-500/30"
            )}
            title={isExpanded ? "Collapse URL" : "Expand URL"}
          >
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        )}
        <p className="text-zinc-300">
          {displayUrl}
        </p>
      </div>
    );
  }
};

const InfoTag = ({ icon: Icon, label, value, className }: { icon?: any, label?: string, value: string | number, className?: string }) => (
  <div className={twMerge("flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/50 text-[10px] whitespace-nowrap", className)}>
    {Icon && <Icon size={10} className="text-zinc-500" />}
    {label && <span className="text-zinc-500 font-medium">{label}:</span>}
    <span className="text-zinc-300 font-bold uppercase tracking-wide">{value}</span>
  </div>
);

export const SelectionViewer = () => {
  const { selections, trafficList, setTrafficList } = useTrafficListContext();
  const selected = selections.firstSelected;
  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 italic text-[12px] p-4 bg-[#080808] border-t border-black">
        Select a request to view details
      </div>
    );
  }

  const tags = selected.tags as string[] || [];
  const url = selected.url as string || '';
  const method = selected.method as string || '';
  const code = selected.code as string || '';
  const status = selected.status as string || '';
  const time = selected.time as string || '';
  const duration = selected.duration as string || '';

  const getCodeColor = (code: string) => {
    if (code.startsWith('2')) return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (code.startsWith('3')) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    if (code.startsWith('4')) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    if (code.startsWith('5')) return 'bg-red-500/10 border-red-500/20 text-red-400';
    return 'bg-zinc-800 border-zinc-700 text-zinc-400';
  };

  return (
    <div className='flex flex-col border-t border-zinc-900 w-full bg-[#0a0a0a] shadow-2xl'>
      {/* URL Section */}
      <div id='url-viewer' className='border-b border-zinc-900/50 w-full p-3 bg-black/40'>
        <UrlColorizer url={url} intercepted={selected.intercepted as boolean} />
      </div>

      {/* Tags Section */}
      <div className='flex flex-wrap items-center gap-2 p-2 bg-[#0d0d0d] min-h-[36px] px-3'>
        {/* Method Tag */}
        <div className={twMerge(
          "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter border",
          method === 'GET' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' :
            method === 'POST' ? 'bg-green-600/10 border-green-500/20 text-green-400' :
              method === 'PUT' ? 'bg-orange-600/10 border-orange-500/20 text-orange-400' :
                method === 'DELETE' ? 'bg-red-600/10 border-red-500/20 text-red-400' :
                  'bg-zinc-800 border-zinc-700 text-zinc-300'
        )}>
          {method}
        </div>

        {/* Status Code Tag */}
        {code && (
          <div className={twMerge("px-2 py-0.5 rounded text-[10px] font-bold border", getCodeColor(code))}>
            {code} {status && <span className="opacity-60 ml-1 ml-1">{status}</span>}
          </div>
        )}

        {/* Latency & Size Tags */}
        <div className="flex items-center gap-2 border-l border-zinc-800 ml-1 pl-3">
          {time && <InfoTag icon={FiClock} value={time} />}
          {duration && <InfoTag icon={FiBox} value={duration} />}
        </div>

        {/* Divider */}
        {tags.length > 0 && <div className="h-3 w-[1px] bg-zinc-800 mx-1" />}

        {/* Custom Tags */}
        {tags.map((e, i) => (
          <CustomTag key={i} tagName={e} />
        ))}
      </div>
    </div>
  );
};
