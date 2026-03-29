import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Breakpoints = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
};

const ContainerQueryContext = createContext<Breakpoints>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1200,
});

export const useContainerQuery = () => useContext(ContainerQueryContext);

export const ContainerQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [breakpoints, setBreakpoints] = useState<Breakpoints>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1200,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setBreakpoints({
          width,
          isMobile: width < 640,
          isTablet: width >= 640 && width < 1024,
          isDesktop: width >= 1024,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <ContainerQueryContext.Provider value={breakpoints}>
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {children}
      </div>
    </ContainerQueryContext.Provider>
  );
};
