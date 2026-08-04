import { useState, useEffect } from 'react';
import { BRAND_LIST, subscribeBrandChanges } from '../data/brands';
import type { BrandInfo } from '../types/ktv';

export function useBrands(): BrandInfo[] {
  const [brands, setBrands] = useState<BrandInfo[]>(BRAND_LIST);

  useEffect(() => {
    setBrands([...BRAND_LIST]);
    const unsubscribe = subscribeBrandChanges((newBrands) => {
      setBrands([...newBrands]);
    });
    return unsubscribe;
  }, []);

  return brands;
}
