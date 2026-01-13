import React, { createContext, useContext, useMemo, useState } from 'react';

interface BrandContextValue {
  brandName: string | null;
  setBrandName: (name: string | null) => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export const BrandProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [brandName, setBrandName] = useState<string | null>(null);
  const value = useMemo(() => ({ brandName, setBrandName }), [brandName]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return ctx;
};
