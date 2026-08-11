import { useEffect, useMemo, useState } from 'react';
import { Music2, Sparkles } from 'lucide-react';
import { TaiwanHeatMap, type RegionPath, type RegionPulse } from './TaiwanHeatMap';
import { VisitStatsPanel } from './VisitStatsPanel';

const REGION_LABELS: Record<string, string> = {
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

const REGION_VISITS: Record<string, number> = {
  TWNWT: 18420,
  TWTPE: 15680,
  TWTAO: 12890,
  TWTXG: 14230,
  TWTNN: 8240,
  TWKHH: 11760,
  TWCHA: 6480,
  TWPIF: 4890,
  TWHSQ: 4360,
  TWHSZ: 3920,
  TWMIA: 4180,
  TWYUN: 3660,
  TWCYQ: 2860,
  TWCYI: 2480,
  TWNAN: 3420,
  TWILA: 3280,
  TWHUA: 2970,
  TWTTT: 2520,
  TWKEE: 2860,
  TWPEN: 1640,
  TWKIN: 1420,
  TWLIE: 620,
};

export function TaiwanMapDemo() {
  const [regions, setRegions] = useState<RegionPath[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>(() => ({ ...REGION_VISITS }));
  const [userRegionId, setUserRegionId] = useState('TWTXG');
  const [regionPulses, setRegionPulses] = useState<RegionPulse[]>([]);

  useEffect(() => {
    fetch('/MapSVG/TaiwanMap.svg')
      .then((response) => response.text())
      .then((svgText) => {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const paths = Array.from(doc.querySelectorAll('#features path')).map((path) => ({
          id: path.getAttribute('id') || '',
          name: path.getAttribute('name') || '',
          d: path.getAttribute('d') || '',
        })).filter((path) => path.id && path.d);
        setRegions(paths);
      });
  }, []);

  const maxVisits = useMemo(() => Math.max(...Object.values(visitCounts)), [visitCounts]);
  const totalVisits = useMemo(() => Object.values(visitCounts).reduce((sum, count) => sum + count, 0), [visitCounts]);
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0)), [regions, visitCounts]);
  const selectedRegion = selectedId ? regions.find((region) => region.id === selectedId) : undefined;
  const selectedVisits = selectedRegion ? visitCounts[selectedRegion.id] || 0 : 0;
  const selectedPercent = totalVisits && selectedVisits ? ((selectedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const addRegionPulse = (regionId: string, delta: 1 | -1) => {
    const pulse = { id: Date.now() + Math.random(), regionId, delta };
    setRegionPulses((current) => [...current, pulse]);
    window.setTimeout(() => {
      setRegionPulses((current) => current.filter((item) => item.id !== pulse.id));
    }, 980);
  };

  const handleJoinSelectedRegion = () => {
    const nextRegionId = selectedRegion?.id;
    if (!nextRegionId || nextRegionId === userRegionId) return;
    setVisitCounts((current) => ({
      ...current,
      [userRegionId]: Math.max(0, (current[userRegionId] || 0) - 1),
      [nextRegionId]: (current[nextRegionId] || 0) + 1,
    }));
    addRegionPulse(userRegionId, -1);
    addRegionPulse(nextRegionId, 1);
    setUserRegionId(nextRegionId);
    setSelectedId(nextRegionId);
  };

  return (
    <main className="taiwan-demo-shell">
      <section className="taiwan-demo-hero">
        <div className="taiwan-demo-kicker"><Sparkles size={15} /> 全台 KTV 歌友到訪紀錄</div>
        <div className="taiwan-demo-title-row">
          <div>
            <h1>歌友熱度分布</h1>
            <p>用台灣縣市地圖呈現歌友到訪熱度，點選縣市可聚焦查看，按「我在這裡」可預覽修正回饋。</p>
          </div>
          <a className="taiwan-demo-back" href="/">回主頁</a>
        </div>
      </section>

      <section className="taiwan-demo-grid">
        <TaiwanHeatMap
          regions={regions}
          selectedRegion={selectedRegion}
          selectedId={selectedId}
          userRegionId={userRegionId}
          visitCounts={visitCounts}
          maxVisits={maxVisits}
          regionLabels={REGION_LABELS}
          regionPulses={regionPulses}
          onSelectRegion={setSelectedId}
          onJoinSelectedRegion={handleJoinSelectedRegion}
        />

        <VisitStatsPanel
          totalVisits={totalVisits}
          userRegionId={userRegionId}
          selectedRegion={selectedRegion}
          selectedVisits={selectedVisits}
          selectedPercent={selectedPercent}
          sortedRegions={sortedRegions}
          visitCounts={visitCounts}
          regionLabels={REGION_LABELS}
          onSelectRegion={setSelectedId}
          onJoinSelectedRegion={handleJoinSelectedRegion}
        />
      </section>

      <section className="taiwan-demo-note">
        <Music2 size={18} />
        <p>這個頁面僅供本機檢視互動效果；正式入口請使用首頁的累積查詢標籤。</p>
      </section>
    </main>
  );
}
