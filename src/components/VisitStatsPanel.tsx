import { BarChart3, MapPinned, TrendingUp, UsersRound } from 'lucide-react';
import type { RegionPath } from './TaiwanHeatMap';
import type { DailyVisitStat, VisitRegionStat } from '../services/apiService';

type VisitStatsPanelProps = {
  totalVisits: number;
  userRegionId: string;
  selectedRegion: RegionPath | undefined;
  selectedVisits: number;
  selectedPercent: string;
  sortedRegions: RegionPath[];
  otherRegions?: VisitRegionStat[];
  visitCounts: Record<string, number>;
  regionLabels: Record<string, string>;
  onSelectRegion: (regionId: string) => void;
  onJoinSelectedRegion: () => void;
  showUserRegion?: boolean;
  showJoinAction?: boolean;
  joinActionDisabled?: boolean;
  joinActionLabel?: string;
  actionMessage?: string;
  dailyStats?: DailyVisitStat[];
  todayCount?: number;
  isDailyStatsLoading?: boolean;
  dailyStatsError?: string;
};

function formatCount(value: number) {
  return value.toLocaleString('zh-TW');
}

function formatShortDate(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return month && day ? `${month}/${day}` : date;
}

function formatCompactDate(date: string, index: number) {
  const [, month, day] = date.split('-').map(Number);
  if (!month || !day) return date;
  return index === 0 || day === 1 ? `${month}/${day}` : String(day);
}

export function VisitStatsPanel({
  totalVisits,
  userRegionId,
  selectedRegion,
  selectedVisits,
  selectedPercent,
  sortedRegions,
  otherRegions = [],
  visitCounts,
  regionLabels,
  onSelectRegion,
  onJoinSelectedRegion,
  showUserRegion = true,
  showJoinAction = true,
  joinActionDisabled,
  joinActionLabel,
  actionMessage,
  dailyStats = [],
  todayCount = 0,
  isDailyStatsLoading = false,
  dailyStatsError = '',
}: VisitStatsPanelProps) {
  const userRegionName = regionLabels[userRegionId] || '未選擇';
  const maxDailyCount = Math.max(1, ...dailyStats.map((item) => item.count));

  return (
    <aside className="taiwan-demo-side">
      <div className="taiwan-demo-stat">
        <UsersRound size={22} />
        <span>累積歌友到訪</span>
        <strong>{formatCount(totalVisits)}</strong>
      </div>

      <div className="taiwan-demo-daily-trend">
        <div className="taiwan-demo-daily-head">
          <span><BarChart3 size={16} /> 近 10 日到訪</span>
        </div>
        {isDailyStatsLoading && <p className="taiwan-demo-daily-empty">每日統計讀取中...</p>}
        {!isDailyStatsLoading && dailyStatsError && <p className="taiwan-demo-daily-empty">{dailyStatsError}</p>}
        {!isDailyStatsLoading && !dailyStatsError && (
          <>
            <div className="taiwan-demo-daily-bars" aria-label="近 10 日每日到訪人數">
              {dailyStats.map((item, index) => {
                const height = item.count ? Math.max(12, Math.round((item.count / maxDailyCount) * 100)) : 4;
                const isToday = index === dailyStats.length - 1;
                return (
                  <div key={item.date} className={`taiwan-demo-daily-bar ${isToday ? 'is-today' : ''}`} title={`${formatShortDate(item.date)}：${formatCount(item.count)} 人`}>
                    <i style={{ height: `${height}%` }} />
                    <span aria-label={formatShortDate(item.date)}>{formatCompactDate(item.date, index)}</span>
                    <em>{formatCount(item.count)}</em>
                  </div>
                );
              })}
            </div>
            <p className="taiwan-demo-daily-note">今日 {formatCount(todayCount)} 人</p>
          </>
        )}
      </div>

      {showUserRegion && (
        <div className="taiwan-demo-user-region">
          <span>目前記錄位置</span>
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
        {otherRegions.map((region) => (
          <div key={region.city_code} className="taiwan-demo-ranking-extra">
            <span>境外</span>
            <strong>{region.city_name}</strong>
            <em>{formatCount(region.total_count)}</em>
          </div>
        ))}
      </div>
    </aside>
  );
}
