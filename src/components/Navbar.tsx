import React, { useState, useEffect } from 'react';
import { Mic2, Table2, LayoutGrid, Heart, PlusCircle, Sun, Moon } from 'lucide-react';
import type { FilterOptions } from '../types/ktv';

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

  useEffect(() => {
    let isMounted = true;

    const fetchAuthenticVisitorCount = async () => {
      try {
        // 取得或產生固定裝置訪客 UUID (避免重新整理狂加數字)
        let visitorId = localStorage.getItem('tw_ktv_vid');
        if (!visitorId) {
          visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem('tw_ktv_vid', visitorId);
        }

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
        {/* Brand Logo & Pure Clean Title with Live Visitor Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f472b6, #c084fc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(244, 114, 182, 0.35)',
          }}>
            <Mic2 size={24} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="navbar-title">
              台灣 KTV 歌曲查詢
            </h1>

            {/* Live Visitor Counter Badge */}
            <div 
              title="全台歌友實時線上查詢中"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#4ade80',
                boxShadow: '0 0 12px rgba(34, 197, 94, 0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                display: 'inline-block',
              }} />
              <span>{onlineCount.toLocaleString()} 人線上</span>
            </div>

            {/* Accumulated Visitor Counter Badge */}
            <div 
              title={
                isStatsError
                  ? '全站累積查詢人數暫時無法連線同步'
                  : !isStatsPersistent
                    ? '全台歌友累積查詢數 (本機模式)'
                    : '全台歌友累積查詢與使用人數 (12小時去重與 Redis 全站同步)'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: isStatsError ? 'rgba(248, 113, 113, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                border: `1px solid ${isStatsError ? 'rgba(248, 113, 113, 0.35)' : 'rgba(168, 85, 247, 0.35)'}`,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isStatsError ? '#f87171' : '#c084fc',
                boxShadow: isStatsError ? '0 0 12px rgba(248, 113, 113, 0.25)' : '0 0 12px rgba(168, 85, 247, 0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span>
                {isStatsLoading
                  ? '累積查詢同步中...'
                  : isStatsError
                    ? '累積查詢暫未同步'
                    : `${isStatsPersistent ? '累積查詢' : '本機統計'} ${totalVisits?.toLocaleString() ?? 1} 人`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="nav-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{
              borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(147, 51, 234, 0.4)',
              color: theme === 'dark' ? '#fbbf24' : '#9333ea',
              background: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(147, 51, 234, 0.1)',
            }}
            title={theme === 'dark' ? '切換至莫蘭迪日光/亮色模式' : '切換至微光夜間模式'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? '日光' : '夜間'}</span>
          </button>

          {/* Suggest Addition Button */}
          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              className="btn-secondary"
              style={{
                borderColor: 'rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.1)',
              }}
              title="提供新歌曲、KTV 廠牌或伴唱系統資料建議"
            >
              <PlusCircle size={16} />
              <span>提供建議</span>
            </button>
          )}

          {/* Favorite Songs Button */}
          <button
            onClick={onOpenFavorites}
            className="btn-secondary"
            style={{
              borderColor: favoriteCount > 0 ? 'rgba(236, 72, 153, 0.4)' : undefined,
              color: favoriteCount > 0 ? '#f472b6' : undefined,
            }}
          >
            <Heart size={16} fill={favoriteCount > 0 ? '#ec4899' : 'none'} color={favoriteCount > 0 ? '#ec4899' : 'currentColor'} />
            <span>我的歌本</span>
          </button>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'matrix'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'matrix' }));
              }}
              style={{
                background: filters.viewMode === 'matrix' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
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
              style={{
                background: filters.viewMode === 'cards' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
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
