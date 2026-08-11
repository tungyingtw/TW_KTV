import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, X } from 'lucide-react';
import { correctVisitRegion, fetchVisitRegionStats, type VisitRegionStatsResponse } from '../services/apiService';
import { TaiwanHeatMap, type RegionPath, type RegionPulse } from './TaiwanHeatMap';
import { VisitStatsPanel } from './VisitStatsPanel';

type VisitRegionHeatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type VisitRegionHeatContentProps = {
  onClose?: () => void;
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

export function VisitRegionHeatContent({ onClose }: VisitRegionHeatContentProps) {
  const [regions, setRegions] = useState<RegionPath[]>([]);
  const [stats, setStats] = useState<VisitRegionStatsResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmedRegionId, setConfirmedRegionId] = useState('');
  const [regionPulses, setRegionPulses] = useState<RegionPulse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');
    setActionMessage('');

    Promise.all([
      fetch('/MapSVG/TaiwanMap.svg').then((response) => {
        if (!response.ok) throw new Error('地圖讀取失敗');
        return response.text();
      }),
      fetchVisitRegionStats(),
    ])
      .then(([svgText, nextStats]) => {
        if (!isMounted) return;
        setRegions(parseTaiwanMapSvg(svgText));
        setStats(nextStats);
      })
      .catch(() => {
        if (isMounted) setError('熱度暫時無法讀取');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    for (const region of stats?.regions || []) labels[region.city_code] = region.city_name;
    return labels;
  }, [stats]);

  const visitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const region of stats?.regions || []) counts[region.city_code] = region.total_count;
    return counts;
  }, [stats]);

  const maxVisits = useMemo(() => Math.max(1, ...Object.values(visitCounts)), [visitCounts]);
  const totalVisits = stats?.total_count || 0;
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0)), [regions, visitCounts]);
  const selectedRegion = selectedId ? regions.find((region) => region.id === selectedId) : undefined;
  const selectedVisits = selectedRegion ? visitCounts[selectedRegion.id] || 0 : 0;
  const selectedPercent = totalVisits && selectedVisits ? ((selectedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const handleJoinSelectedRegion = async () => {
    if (!selectedRegion || isSubmitting || selectedRegion.id === confirmedRegionId) return;
    setIsSubmitting(true);
    setActionMessage('');

    try {
      const result = await correctVisitRegion(selectedRegion.id);
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
      setActionMessage(result.corrected ? '已更新你的所在城市' : result.created || result.counted ? '已加入你的所在城市' : '你的所在城市已是這裡');
      if (nextPulses.length) {
        setRegionPulses(nextPulses);
        if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = window.setTimeout(() => setRegionPulses([]), 1200);
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : '暫時無法更新所在城市');
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinActionDisabled = isSubmitting || selectedRegion?.id === confirmedRegionId;
  const joinActionLabel = isSubmitting ? '更新中...' : selectedRegion?.id === confirmedRegionId ? '已在這裡' : '我在這裡';

  return (
    <>
      <header className="visit-region-modal-header">
        <div>
          <span><Activity size={15} /> 全台 KTV 歌友</span>
          <h2 id="visit-region-modal-title">歌友熱度分布</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="關閉歌友熱度分布">
            <X size={20} />
          </button>
        )}
      </header>

      {isLoading && <div className="visit-region-modal-state">熱度讀取中...</div>}
      {!isLoading && error && <div className="visit-region-modal-state is-error">{error}</div>}
      {!isLoading && !error && (
        <div className="visit-region-modal-grid">
          <TaiwanHeatMap
            regions={regions}
            selectedRegion={selectedRegion}
            selectedId={selectedId}
            userRegionId={confirmedRegionId}
            visitCounts={visitCounts}
            maxVisits={maxVisits}
            regionLabels={regionLabels}
            regionPulses={regionPulses}
            onSelectRegion={setSelectedId}
            onJoinSelectedRegion={handleJoinSelectedRegion}
            showJoinAction
            joinActionDisabled={joinActionDisabled}
            joinActionLabel={joinActionLabel}
          />
          <VisitStatsPanel
            totalVisits={totalVisits}
            userRegionId={confirmedRegionId}
            selectedRegion={selectedRegion}
            selectedVisits={selectedVisits}
            selectedPercent={selectedPercent}
            sortedRegions={sortedRegions}
            visitCounts={visitCounts}
            regionLabels={regionLabels}
            onSelectRegion={setSelectedId}
            onJoinSelectedRegion={handleJoinSelectedRegion}
            showUserRegion={Boolean(confirmedRegionId)}
            showJoinAction
            joinActionDisabled={joinActionDisabled}
            joinActionLabel={joinActionLabel}
            actionMessage={actionMessage}
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
