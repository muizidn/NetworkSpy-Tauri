import { useState, useEffect, useContext } from 'react';
import { useContainerQuery } from '../context/ContainerQueryContext';

export const useIsMobile = (breakpoint: number = 768) => {
  const container = useContainerQuery();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    // If container width is available from context, use it.
    // Otherwise fallback to window width.
    if (container && container.width > 0) {
        setIsMobile(container.width < breakpoint);
    } else {
        const handleResize = () => {
          setIsMobile(window.innerWidth < breakpoint);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [breakpoint, container]);

  return isMobile;
};
