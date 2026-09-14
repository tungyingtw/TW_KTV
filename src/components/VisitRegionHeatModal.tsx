import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, X } from 'lucide-react';
import { correctVisitRegion, fetchDailyVisitStats, fetchVisitRegionStats, type DailyVisitStatsResponse, type VisitRegionStatsResponse } from '../services/apiService';
import { TaiwanHeatMap, type RegionPath, type RegionPulse } from './TaiwanHeatMap';
import './VisitRegionHeat.css';
import { VisitStatsPanel } from './VisitStatsPanel';

type VisitRegionHeatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type VisitRegionHeatContentProps = {
  onClose?: () => void;
  compactHeader?: boolean;
};

const FALLBACK_REGION_LABELS: Record<string, string> = {
  TWCHA: '彰化縣',
  TWCYI: '嘉義市',
  TWCYQ: '嘉義縣',
  TWHSQ: '新竹縣',
  TWHSZ: '新竹市',
  TWHUA: '花蓮縣',
  TWILA: '宜蘭縣',
  TWKEE: '基隆市',
  TWKHH: '高雄市',
  TWKIN: '金門縣',
  TWLIE: '連江縣',
  TWMIA: '苗栗縣',
  TWNAN: '南投縣',
  TWNWT: '新北市',
  TWPEN: '澎湖縣',
  TWPIF: '屏東縣',
  TWTNN: '台南市',
  TWTPE: '台北市',
  TWTAO: '桃園市',
  TWTTT: '台東縣',
  TWTXG: '台中市',
  TWYUN: '雲林縣',
};

function parseTaiwanMapSvg(svgText: string): RegionPath[] {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  return Array.from(doc.querySelectorAll('#features path'))
    .map((path) => ({
      id: path.getAttribute('id') || '',
      name: path.getAttribute('name') || '',
      d: path.getAttribute('d') || '',
    }))
    .filter((path) => path.id && path.d);
}

export function VisitRegionHeatContent({ onClose, compactHeader = false }: VisitRegionHeatContentProps) {
  const [regions, setRegions] = useState<RegionPath[]>([]);
  const [stats, setStats] = useState<VisitRegionStatsResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmedRegionId, setConfirmedRegionId] = useState('');
  const [regionPulses, setRegionPulses] = useState<RegionPulse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isDailyStatsLoading, setIsDailyStatsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyVisitStatsResponse | null>(null);
  const [dailyStatsError, setDailyStatsError] = useState('');
  const [error, setError] = useState('');
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setIsLoading(true);
    setIsDailyStatsLoading(true);
    setError('');
    setDailyStats(null);
    setDailyStatsError('');
    setActionMessage('');

    fetchDailyVisitStats(10, controller.signal)
      .then((nextDailyStats) => {
        if (!isMounted) return;
        setDailyStats(nextDailyStats);
        setDailyStatsError('');
      })
      .catch(() => {
        if (isMounted) setDailyStatsError('近 10 日統計暫時無法讀取');
      })
      .finally(() => {
        if (isMounted) setIsDailyStatsLoading(false);
      });

    Promise.all([
      fetch('/MapSVG/TaiwanMap.svg', { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error('地圖讀取失敗');
        return response.text();
      }),
      fetchVisitRegionStats(controller.signal),
    ])
      .then(([svgText, nextStats]) => {
        if (!isMounted) return;
        const paths = parseTaiwanMapSvg(svgText);
        if (!paths.length) throw new Error('地圖內容無效');
        setRegions(paths);
        setStats(nextStats);
        setConfirmedRegionId(nextStats.user_region_code || '');
      })
      .catch(() => {
        if (isMounted) setError('熱度暫時無法讀取，請稍後重試');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
  }, []);

  const regionLabels = useMemo(() => {
    const labels = { ...FALLBACK_REGION_LABELS };
    for (const region of stats?.regions || []) if (region.city_name) labels[region.city_code] = region.city_name;
    return labels;
  }, [stats]);

  const visitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const region of stats?.regions || []) counts[region.city_code] = region.total_count;
    return counts;
  }, [stats]);

  const maxVisits = useMemo(() => Math.max(1, ...regions.map(region => visitCounts[region.id] || 0)), [visitCounts, regions]);
  const totalVisits = stats?.total_count || 0;
  const mapRegionIds = useMemo(() => new Set(regions.map((region) => region.id)), [regions]);
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0)), [regions, visitCounts]);
  const otherRegions = useMemo(() => (stats?.regions || []).filter((region) => !mapRegionIds.has(region.city_code) && region.total_count > 0), [mapRegionIds, stats]);
  const selectRegion = (id: string | null) => { setSelectedId(id); setActionMessage(''); };
  const selectedRegion = selectedId ? regions.find((region) => region.id === selectedId) : undefined;
  const selectedVisits = selectedRegion ? visitCounts[selectedRegion.id] || 0 : 0;
  const selectedPercent = totalVisits && selectedVisits ? ((selectedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const handleJoinSelectedRegion = async () => {
    if (!selectedRegion || isSubmitting || selectedRegion.id === confirmedRegionId) return;
    setIsSubmitting(true);
    setActionMessage('');

    try {
      const targetRegion = selectedRegion;
      const result = await correctVisitRegion(targetRegion.id);
      const nextPulses: RegionPulse[] = [];
      const pulseId = Date.now();
      if (result.corrected && result.from_city_code && result.from_city_code !== result.city_code) {
        nextPulses.push({ id: pulseId, regionId: result.from_city_code, delta: -1 });
        nextPulses.push({ id: pulseId + 1, regionId: result.city_code, delta: 1 });
      } else if (result.created || result.counted) {
        nextPulses.push({ id: pulseId, regionId: result.city_code, delta: 1 });
      }

      setStats(result.stats);
      setConfirmedRegionId(result.city_code);
      setActionMessage(`${regionLabels[result.city_code] || result.city_code}：${result.corrected ? '已更新統計中的地區' : result.created || result.counted ? '已記錄你的地區' : '目前已記錄為此地區'}`);
      if (nextPulses.length) {
        setRegionPulses(nextPulses);
        if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = window.setTimeout(() => setRegionPulses([]), 1200);
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : '暫時無法更新地區');
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinActionDisabled = isSubmitting || selectedRegion?.id === confirmedRegionId;
  const joinActionLabel = isSubmitting ? '更新中...' : selectedRegion?.id === confirmedRegionId ? '已記錄此地區' : '設為我的地區';

  return (
    <>
      {!compactHeader && (
        <header className="visit-region-modal-header">
          <div>
            <span><Activity size={15} /> 台灣 KTV 歌友</span>
            <h2 id="visit-region-modal-title">歌友熱度分布</h2>
            <p>累積到訪的地區分布，並非即時位置。網路位置推估可能不準確，你可以更正統計中的地區。</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="關閉歌友熱度分布">
              <X size={20} />
            </button>
          )}
        </header>
      )}

      {isLoading && <div role="status" className="visit-region-modal-state">熱度讀取中，首次連線可能需要稍候…</div>}
      {!isLoading && error && <div role="alert" className="visit-region-modal-state is-error">{error}<button type="button" className="btn-secondary" onClick={() => setReloadKey(k => k + 1)}>重新讀取</button></div>}
      {!isLoading && !error && (
        <div className="visit-region-modal-grid">
          <div className="visit-region-summary">
            <span>累積到訪分布 · 非即時位置</span>
            <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => setReloadKey(k => k + 1)}>更新統計</button>
          </div>
          <TaiwanHeatMap
            regions={regions}
            selectedRegion={selectedRegion}
            selectedId={selectedId}
            userRegionId={confirmedRegionId}
            visitCounts={visitCounts}
            maxVisits={maxVisits}
            regionLabels={regionLabels}
            regionPulses={regionPulses}
            onSelectRegion={selectRegion}
            onJoinSelectedRegion={handleJoinSelectedRegion}
            showJoinAction
            joinActionDisabled={joinActionDisabled}
            joinActionLabel={joinActionLabel}
            actionMessage={actionMessage}
          />
          <VisitStatsPanel
            totalVisits={totalVisits}
            userRegionId={confirmedRegionId}
            selectedRegion={selectedRegion}
            selectedVisits={selectedVisits}
            selectedPercent={selectedPercent}
            sortedRegions={sortedRegions}
            otherRegions={otherRegions}
            visitCounts={visitCounts}
            regionLabels={regionLabels}
            onSelectRegion={selectRegion}
            onJoinSelectedRegion={handleJoinSelectedRegion}
            showUserRegion={Boolean(confirmedRegionId)}
            showJoinAction
            joinActionDisabled={joinActionDisabled}
            joinActionLabel={joinActionLabel}
            actionMessage={actionMessage}
            dailyStats={dailyStats?.items || []}
            todayCount={dailyStats?.today_count || 0}
            isDailyStatsLoading={isDailyStatsLoading}
            dailyStatsError={dailyStatsError}
            onRetryDailyStats={() => setReloadKey(k => k + 1)}
          />
        </div>
      )}
    </>
  );
}

export function VisitRegionHeatModal({ isOpen, onClose }: VisitRegionHeatModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="visit-region-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-region-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="visit-region-modal">
        <VisitRegionHeatContent onClose={onClose} />
      </section>
    </div>
  );
}
