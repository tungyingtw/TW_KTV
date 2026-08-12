import React, { useState, useEffect } from 'react';
import { Gamepad2, Mic2, Table2, LayoutGrid, Heart, PlusCircle, Sun, Moon } from 'lucide-react';
import type { FilterOptions } from '../../types/ktv';
import { formatCompactZhNumber } from '../../utils/stringUtils';
import { getKtvVisitorId } from '../../services/apiService';

interface MobileNavbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  favoriteCount: number;
  onOpenFavorites: () => void;
  onOpenSuggestSong?: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  filters,
  setFilters,
  favoriteCount,
  onOpenFavorites,
  onOpenSuggestSong,
}) => {
  const openVisitRegionPage = () => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('view', 'visit-region-stats');
    nextUrl.hash = '';
    window.location.assign(`${nextUrl.pathname}${nextUrl.search}`);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('tw_ktv_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('tw_ktv_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [isStatsError, setIsStatsError] = useState<boolean>(false);
  const [isStatsPersistent, setIsStatsPersistent] = useState<boolean>(true);
  const totalVisitsValue = totalVisits ?? 1;
  const totalVisitsFullText = totalVisitsValue.toLocaleString();
  const totalVisitsCompactText = formatCompactZhNumber(totalVisitsValue);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const visitorId = getKtvVisitorId();
        const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');
        const res = await fetch(`${API_BASE}/api/stats/ping?vid=${visitorId}&t=${Date.now()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (typeof data.online === 'number') setOnlineCount(Math.max(1, data.online));
          if (typeof data.totalVisits !== 'number') {
            setIsStatsError(true);
            setIsStatsLoading(false);
            return;
          }
          setTotalVisits(data.totalVisits);
          setIsStatsPersistent(data.persistent !== false);
          setIsStatsError(false);
          setIsStatsLoading(false);
          try { localStorage.setItem('tw_ktv_total_visits_v2', String(data.totalVisits)); } catch {}
        } else if (isMounted) {
          setIsStatsError(true);
          setIsStatsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsStatsError(true);
          setIsStatsLoading(false);
        }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <header className="mobile-navbar" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '8px 12px',
      boxSizing: 'border-box', width: '100%',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div className="mobile-navbar-brand">
            <div className="navbar-logo-mark is-mobile">
              <Mic2 size={18} />
            </div>
            <h1
              className="navbar-title"
              style={{ fontSize: '1.05rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              TYFunLab KTV歌曲查詢
            </h1>
          </div>

          <div className="mobile-navbar-stats">
            <div className="navbar-stat-text is-mobile" title="全台歌友實時線上查詢中">
              <span className="navbar-live-dot" />
              <strong>{onlineCount.toLocaleString()}</strong>
              <span>線上</span>
            </div>
            <button
              type="button"
              onClick={openVisitRegionPage}
              className={`visit-region-trigger navbar-stat-link is-mobile ${isStatsError ? 'is-error' : ''}`}
              title={
                isStatsError
                  ? '全站累積查詢人數暫時無法連線同步'
                  : !isStatsPersistent
                    ? `全台歌友累積查詢數 ${totalVisitsFullText} 人 (本機模式)`
                    : `全台歌友累積查詢與使用人數 ${totalVisitsFullText} 人 (12小時去重與 Redis 全站同步)`
              }
            >
              <span>{isStatsLoading ? '同步中' : isStatsError ? '未同步' : isStatsPersistent ? '累積' : '本機'}</span>
              {!isStatsLoading && !isStatsError && <strong>{totalVisitsCompactText}</strong>}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
          <div className="mobile-navbar-actions">
            <button
              onClick={toggleTheme}
              className="nav-action-link is-mobile"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? '日光' : '夜間'}</span>
            </button>

            {onOpenSuggestSong && (
              <button
                onClick={onOpenSuggestSong}
                className="nav-action-link nav-action-primary is-mobile"
              >
                <PlusCircle size={16} />
                <span>提供建議</span>
              </button>
            )}

            <a
              href="./games/"
              className="nav-action-link is-mobile"
              title="前往 KTV 小遊戲列表"
            >
              <Gamepad2 size={16} />
              <span>遊戲</span>
            </a>

            <button
              onClick={onOpenFavorites}
              className={`nav-action-link is-mobile ${favoriteCount > 0 ? 'is-active' : ''}`}
            >
              <Heart size={16} fill={favoriteCount > 0 ? 'var(--accent-pink)' : 'none'} color="currentColor" />
              <span>歌本({favoriteCount})</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="nav-view-switcher is-mobile">
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'matrix'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'matrix' }));
              }}
              className={filters.viewMode === 'matrix' ? 'is-active' : ''}
              title="列表模式 (各 KTV 廠牌一覽)"
            >
              <Table2 size={16} />
            </button>
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'cards'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'cards' }));
              }}
              className={filters.viewMode === 'cards' ? 'is-active' : ''}
              title="小卡模式 (經典單首卡片)"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
