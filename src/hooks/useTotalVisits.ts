import { useEffect, useState } from 'react';
import { fetchTotalVisitStats } from '../services/apiService';

export function useTotalVisits(reloadKey: number) {
  const [total, setTotal] = useState<number | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    const refresh = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const data = await fetchTotalVisitStats(controller.signal);
        if (active) { setTotal(data.totalVisits); setPersistent(data.persistent); setError(false); }
      } catch { if (active) setError(true); }
      finally { clearTimeout(timeout); if (active) timer = setTimeout(refresh, 15000); }
    };
    void refresh();
    return () => { active = false; clearTimeout(timer); controller?.abort(); };
  }, [reloadKey]);
  return { total, persistent, error };
}
