import React, { useState, useEffect } from 'react';
import { Gamepad2, Mic2, Table2, LayoutGrid, Heart, PlusCircle } from 'lucide-react';
import type { FilterOptions } from '../types/ktv';
import { formatCompactZhNumber } from '../utils/stringUtils';
import { getKtvVisitorId } from '../services/apiService';

interface NavbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  favoriteCount: number;
  onOpenFavorites: () => void;
  onOpenSuggestSong?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
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

  // 日間/夜間 莫蘭迪主題模式切換
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
  // 100% 真實訪客線上與累積人數統計 (12小時去重與 Redis 全站同步)
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

    const fetchAuthenticVisitorCount = async () => {
      try {
        // 取得或產生固定裝置訪客 UUID (避免重新整理狂加數字)
        const visitorId = getKtvVisitorId();
        const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');
        const res = await fetch(`${API_BASE}/api/stats/ping?vid=${visitorId}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && isMounted) {
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
          }
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

    fetchAuthenticVisitorCount();
    const interval = setInterval(fetchAuthenticVisitorCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 20px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div className="navbar-brand-area">
          <div className="navbar-logo-mark">
            <Mic2 size={22} />
          </div>
          <div className="navbar-brand-copy">
            <h1 className="navbar-title">
              TYFunLab 台灣KTV歌曲查詢
            </h1>

            <div 
              className="navbar-stat-text"
              title="全台歌友實時線上查詢中"
            >
              <span className="navbar-live-dot" />
              <strong>{onlineCount.toLocaleString()}</strong>
              <span>人線上</span>
            </div>

            <button
              type="button"
              onClick={openVisitRegionPage}
              className={`visit-region-trigger navbar-stat-link ${isStatsError ? 'is-error' : ''}`}
              title={
                isStatsError
                  ? '全站累積查詢人數暫時無法連線同步'
                  : !isStatsPersistent
                    ? `全台歌友累積查詢數 ${totalVisitsFullText} 人 (本機模式)`
                    : `全台歌友累積查詢與使用人數 ${totalVisitsFullText} 人 (12小時去重與 Redis 全站同步)`
              }
            >
              <span>{isStatsLoading ? '累積同步中' : isStatsError ? '累積未同步' : isStatsPersistent ? '累積查詢' : '本機統計'}</span>
              {!isStatsLoading && !isStatsError && <strong>{totalVisitsCompactText}</strong>}
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="nav-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-switch"
            title={theme === 'dark' ? '切換至日光模式' : '切換至夜間模式'}
            aria-label={theme === 'dark' ? '切換至日光模式' : '切換至夜間模式'}
          >
            <span className="theme-switch-thumb" aria-hidden="true" />
            <span className="theme-switch-label is-light">日</span>
            <span className="theme-switch-label is-dark">夜</span>
          </button>

          {/* Suggest Addition Button */}
          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              className="nav-action-link nav-action-primary"
              title="提供新歌曲、KTV 廠牌或伴唱系統資料建議"
            >
              <PlusCircle size={16} />
              <span>提供建議</span>
            </button>
          )}

          <a
            href="./games/index.html"
            className="nav-action-link"
            title="前往 KTV 小遊戲列表"
          >
            <Gamepad2 size={16} />
            <span>小遊戲</span>
          </a>

          {/* Favorite Songs Button */}
          <button
            onClick={onOpenFavorites}
            className={`nav-action-link ${favoriteCount > 0 ? 'is-active' : ''}`}
          >
            <Heart size={16} fill={favoriteCount > 0 ? 'var(--accent-pink)' : 'none'} color="currentColor" />
            <span>我的歌本</span>
          </button>

          {/* View Mode Switcher */}
          <div className="nav-view-switcher">
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'matrix'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'matrix' }));
              }}
              className={filters.viewMode === 'matrix' ? 'is-active' : ''}
              title="列表模式 (各 KTV 廠牌一覽)"
            >
              <Table2 size={16} />
              <span className="desktop-only">列表模式</span>
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
              <span className="desktop-only">小卡模式</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
