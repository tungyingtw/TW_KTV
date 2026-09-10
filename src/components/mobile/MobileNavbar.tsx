import React, { useState, useEffect } from 'react';
import { Gamepad2, Mic2, Heart, PlusCircle } from 'lucide-react';
import { formatCompactZhNumber } from '../../utils/stringUtils';
import { getKtvVisitorId } from '../../services/apiService';

interface MobileNavbarProps {
  favoriteCount: number;
  onOpenFavorites: () => void;
  onOpenSuggestSong?: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
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
              TYFunLab
            </h1>
          </div>

          <div className="mobile-navbar-stats">
            <div className="navbar-stat-text is-mobile" title="估計目前在線使用人數">
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
                  ? '暫時無法讀取到訪統計'
                  : !isStatsPersistent
                    ? `累積到訪 ${totalVisitsFullText} 人次（暫時計數）`
                    : `累積到訪 ${totalVisitsFullText} 人次；短時間重複造訪不重複計入`
              }
            >
              <span>{isStatsLoading ? '同步中' : isStatsError ? '未同步' : isStatsPersistent ? '累積' : '暫存'}</span>
              {!isStatsLoading && !isStatsError && <strong>{totalVisitsCompactText}</strong>}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
          <div className="mobile-navbar-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-switch is-mobile"
              aria-label={theme === 'dark' ? '切換至日光模式' : '切換至夜間模式'}
            >
              <span className="theme-switch-thumb" aria-hidden="true" />
              <span className="theme-switch-label is-light">日</span>
              <span className="theme-switch-label is-dark">夜</span>
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
              href="./games/index.html"
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

        </div>
      </div>
    </header>
  );
};
