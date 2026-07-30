import React, { useState, useEffect } from 'react';
import { Mic2, Table2, LayoutGrid, Heart, PlusCircle, Sun, Moon } from 'lucide-react';
import type { FilterOptions } from '../../types/ktv';

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
  const [totalVisits, setTotalVisits] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('tw_ktv_total_visits_v2');
      return stored ? parseInt(stored, 10) : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        let visitorId = localStorage.getItem('tw_ktv_vid');
        if (!visitorId) {
          visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem('tw_ktv_vid', visitorId);
        }
        const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');
        const res = await fetch(`${API_BASE}/api/stats/ping?vid=${visitorId}&t=${Date.now()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (typeof data.online === 'number') setOnlineCount(Math.max(1, data.online));
          if (typeof data.totalVisits === 'number') {
            setTotalVisits(data.totalVisits);
            try { localStorage.setItem('tw_ktv_total_visits_v2', String(data.totalVisits)); } catch {}
          }
        }
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '8px 12px',
      boxSizing: 'border-box', width: '100%',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {/* Row 1: Brand & Counters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #f472b6, #c084fc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Mic2 size={18} color="#ffffff" />
            </div>
            <h1 style={{
              fontSize: '1.05rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap',
              background: 'linear-gradient(90deg, #ffffff 0%, #f472b6 60%, #c084fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              台灣 KTV 歌曲查詢
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px',
              borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
              fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', whiteSpace: 'nowrap',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              <span>{onlineCount}人在線</span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
              borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)',
              fontSize: '0.7rem', fontWeight: 700, color: '#c084fc', whiteSpace: 'nowrap',
            }}>
              <span>{totalVisits.toLocaleString()}人次</span>
            </div>
          </div>
        </div>

        {/* Row 2: Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{
                padding: '4px 8px', fontSize: '0.75rem', borderRadius: '8px',
                borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(147, 51, 234, 0.4)',
                color: theme === 'dark' ? '#fbbf24' : '#9333ea',
              }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? '日光' : '夜間'}</span>
            </button>

            {onOpenSuggestSong && (
              <button
                onClick={onOpenSuggestSong}
                className="btn-secondary"
                style={{
                  padding: '4px 8px', fontSize: '0.75rem', borderRadius: '8px',
                  borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)',
                }}
              >
                <PlusCircle size={14} />
                <span>建議</span>
              </button>
            )}

            <button
              onClick={onOpenFavorites}
              className="btn-secondary"
              style={{
                padding: '4px 8px', fontSize: '0.75rem', borderRadius: '8px',
                borderColor: favoriteCount > 0 ? 'rgba(236, 72, 153, 0.4)' : undefined,
                color: favoriteCount > 0 ? '#f472b6' : undefined,
              }}
            >
              <Heart size={14} fill={favoriteCount > 0 ? '#ec4899' : 'none'} color={favoriteCount > 0 ? '#ec4899' : 'currentColor'} />
              <span>歌本({favoriteCount})</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div style={{
            display: 'flex', background: 'rgba(255, 255, 255, 0.06)',
            padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'matrix'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'matrix' }));
              }}
              style={{
                background: filters.viewMode === 'matrix' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)',
                border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
              title="列表模式 (各 KTV 廠牌一覽)"
            >
              <Table2 size={15} />
            </button>
            <button
              onClick={() => {
                try { localStorage.setItem('ktv_view_mode', 'cards'); } catch {}
                setFilters(prev => ({ ...prev, viewMode: 'cards' }));
              }}
              style={{
                background: filters.viewMode === 'cards' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
              title="小卡模式 (經典單首卡片)"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
