import { MapPinned, TrendingUp, UsersRound } from 'lucide-react';
import type { RegionPath } from './TaiwanHeatMap';

type VisitStatsPanelProps = {
  totalVisits: number;
  userRegionId: string;
  selectedRegion: RegionPath | undefined;
  selectedVisits: number;
  selectedPercent: string;
  sortedRegions: RegionPath[];
  visitCounts: Record<string, number>;
  regionLabels: Record<string, string>;
  onSelectRegion: (regionId: string) => void;
  onJoinSelectedRegion: () => void;
  showUserRegion?: boolean;
  showJoinAction?: boolean;
  joinActionDisabled?: boolean;
  joinActionLabel?: string;
  actionMessage?: string;
};

function formatCount(value: number) {
  return value.toLocaleString('zh-TW');
}

export function VisitStatsPanel({
  totalVisits,
  userRegionId,
  selectedRegion,
  selectedVisits,
  selectedPercent,
  sortedRegions,
  visitCounts,
  regionLabels,
  onSelectRegion,
  onJoinSelectedRegion,
  showUserRegion = true,
  showJoinAction = true,
  joinActionDisabled,
  joinActionLabel,
  actionMessage,
}: VisitStatsPanelProps) {
  const userRegionName = regionLabels[userRegionId] || '未選擇';

  return (
    <aside className="taiwan-demo-side">
      <div className="taiwan-demo-stat">
        <UsersRound size={22} />
        <span>累積歌友到訪</span>
        <strong>{formatCount(totalVisits)}</strong>
      </div>

      {showUserRegion && (
        <div className="taiwan-demo-user-region">
          <span>你的歌友地區</span>
          <strong>{userRegionName}</strong>
          <p>如果不在這裡，點選你的縣市後按「我在這裡」。</p>
        </div>
      )}

      <div className="taiwan-demo-selected">
        <div className="taiwan-demo-selected-icon"><MapPinned size={24} /></div>
        <span>目前選取</span>
        <h2>{selectedRegion ? regionLabels[selectedRegion.id] || selectedRegion.name : '全台總覽'}</h2>
        <p>{selectedRegion ? `${formatCount(selectedVisits)} 人，約佔全站 ${selectedPercent}%。` : '點擊任一縣市可聚焦查看；點地圖空白處回到全台總覽。'}</p>
        {selectedRegion && showJoinAction && (
          <button
            type="button"
            className="taiwan-demo-join-button"
            disabled={joinActionDisabled ?? selectedRegion.id === userRegionId}
            onClick={onJoinSelectedRegion}
          >
            {joinActionLabel || (selectedRegion.id === userRegionId ? '已在這裡' : '我在這裡')}
          </button>
        )}
        {actionMessage && <p className="taiwan-demo-action-message">{actionMessage}</p>}
      </div>

      <div className="taiwan-demo-ranking">
        <div className="taiwan-demo-ranking-title"><TrendingUp size={18} /> 熱門地區 Top 8</div>
        {sortedRegions.slice(0, 8).map((region, index) => {
          const visits = visitCounts[region.id] || 0;
          return (
            <button key={region.id} type="button" onClick={() => onSelectRegion(region.id)} className={region.id === selectedRegion?.id ? 'is-active' : ''}>
              <span>{index + 1}</span>
              <strong>{regionLabels[region.id] || region.name}</strong>
              <em>{formatCount(visits)}</em>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
