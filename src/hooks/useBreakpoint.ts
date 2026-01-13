import { useEffect, useState } from 'react';

export const useBreakpoint = (maxWidth = 1024) => {
  const [isBelow, setIsBelow] = useState<boolean>(() => window.innerWidth <= maxWidth);

  useEffect(() => {
    const handler = () => setIsBelow(window.innerWidth <= maxWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [maxWidth]);

  return isBelow;
};
