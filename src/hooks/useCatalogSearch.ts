import { useEffect, useRef, useState } from 'react';
import type { Song, FilterOptions } from '../types/ktv';

const EMPTY: Song[] = [];
export function useCatalogSearch(catalog: Song[], filters: FilterOptions, ready: boolean) {
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const fallbackSearch = useRef<{ catalog: Song[]; search: ReturnType<typeof import('../utils/catalogSearch').createCatalogSearch> } | null>(null);
  const [fallback, setFallback] = useState(false);
  const [result, setResult] = useState<{ catalog: Song[]; filters: FilterOptions; songs: Song[] } | null>(null);
  useEffect(() => {
    if (!ready || fallback) return;
    try {
      const instance = new Worker(new URL('../workers/catalogSearchWorker.ts', import.meta.url), { type: 'module' });
      worker.current = instance;
      instance.onerror = () => setFallback(true);
      instance.postMessage({ type: 'init', songs: catalog });
      return () => { instance.terminate(); worker.current = null; };
    } catch { worker.current?.terminate(); worker.current = null; setFallback(true); }
  }, [catalog, ready, fallback]);
  useEffect(() => {
    const id = ++sequence.current;
    if (!ready) return;
    let cancelled = false;
    if (fallback) {
      void import('../utils/catalogSearch').then(({ createCatalogSearch }) => {
        if (cancelled || id !== sequence.current) return;
        if (fallbackSearch.current?.catalog !== catalog) fallbackSearch.current = { catalog, search: createCatalogSearch(catalog) };
        setResult({ catalog, filters, songs: fallbackSearch.current.search(filters) });
      });
    } else if (worker.current) {
      worker.current.onmessage = ({ data }: MessageEvent<{ id: number; indices: Uint32Array; error?: boolean }>) => {
        if (cancelled || data.id !== sequence.current) return;
        if (data.error) { setFallback(true); return; }
        setResult({ catalog, filters, songs: Array.from(data.indices, i => catalog[i]!) });
      };
      worker.current.postMessage({ type: 'search', id, filters });
    }
    return () => { cancelled = true; };
  }, [catalog, filters, ready, fallback]);
  const current = ready && result?.catalog === catalog && result.filters === filters;
  return { songs: current ? result.songs : EMPTY, pending: ready && !current };
}
