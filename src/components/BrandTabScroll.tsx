import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { BRAND_LIST } from '../data/brands';
import type { BrandId } from '../types/ktv';

interface BrandTabScrollProps {
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  brandFilterMode?: 'any' | 'all_of_them';
  onSelectBrand: (brand: BrandId | 'all') => void;
  onToggleBrand?: (brand: BrandId) => void;
  onClearBrands?: () => void;
  onToggleFilterMode?: () => void;
  brandSongCounts?: Record<BrandId, number>;
  totalSongCount?: number;
}

// 定義主要大廠牌 (Top Major KTV Chains) 與其他廠牌
const PRIMARY_BRAND_IDS: BrandId[] = ['cashbox', 'holiday', 'watering_hole', 'starlight', 'singgo'];

export const BrandTabScroll: React.FC<BrandTabScrollProps> = ({
  selectedBrand,
  selectedBrands = [],
  brandFilterMode = 'any',
  onSelectBrand,
  onToggleBrand,
  onClearBrands,
  onToggleFilterMode,
  brandSongCounts,
  totalSongCount,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollWidth <= scrollRef.current.clientWidth) return;
    setIsMouseDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.6;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && Math.abs(e.deltaY) > 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  // 平滑滾動控制
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const formatCount = (count?: number) => {
    if (count === undefined) return '';
    if (count === 0) return ' ⚠️ 尚無資料';
    if (count >= 10000) return ` (${(count / 10000).toFixed(1)}萬)`;
    if (count >= 1000) return ` (${(count / 1000).toFixed(1)}k)`;
    return ` (${count})`;
  };

  const isMultiSelecting = selectedBrands.length > 0;

  // 判斷選中的廠牌是否屬於「更多廠牌」，若是且當前為精簡模式，自動展開
  const isSelectedInSecondary = (selectedBrand !== 'all' && !PRIMARY_BRAND_IDS.includes(selectedBrand)) ||
    selectedBrands.some(b => !PRIMARY_BRAND_IDS.includes(b));

  const displayedBrands = BRAND_LIST.filter(brand => {
    if (isExpanded || isSelectedInSecondary) return true;
    return PRIMARY_BRAND_IDS.includes(brand.id);
  });

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 120);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [displayedBrands, isExpanded]);

  const secondaryCount = BRAND_LIST.length - PRIMARY_BRAND_IDS.length;

  const handleBrandClick = (brandId: BrandId) => {
    if (onToggleBrand) {
      onToggleBrand(brandId);
    } else {
      onSelectBrand(brandId);
    }
  };

  const handleAllClick = () => {
    if (onClearBrands) onClearBrands();
    onSelectBrand('all');
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto 16px',
      padding: '0 20px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 向左滾動按鈕 (內容有溢出時才動態顯示) */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="btn-secondary"
            style={{
              borderRadius: '50%',
              width: '32px', height: '32px',
              padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            title="向左滾動廠牌"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* 廠牌 Tab 可滾動區域（支援按住滑鼠左右拖曳與滾輪橫向滾動） */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 6px 8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            flex: 1,
            scrollBehavior: isMouseDown ? 'auto' : 'smooth',
            cursor: (canScrollLeft || canScrollRight) ? (isMouseDown ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
          }}
        >
          {/* 全部廠牌 Tab */}
          <button
            onClick={handleAllClick}
            style={{
              background: !isMultiSelecting && selectedBrand === 'all'
                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                : 'rgba(30, 41, 59, 0.75)',
              color: '#fff',
              border: `1px solid ${!isMultiSelecting && selectedBrand === 'all' ? 'transparent' : 'rgba(255, 255, 255, 0.12)'}`,
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: !isMultiSelecting && selectedBrand === 'all' ? '0 0 16px rgba(236, 72, 153, 0.45)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            全部廠牌 ({BRAND_LIST.length}){totalSongCount ? ` · ${totalSongCount >= 10000 ? (totalSongCount / 10000).toFixed(1) + '萬首' : totalSongCount + '首'}` : ''}
          </button>

          {/* 各大 KTV 廠牌 */}
          {displayedBrands.map(brand => {
            const isSelected = selectedBrands.includes(brand.id) || (!isMultiSelecting && selectedBrand === brand.id);
            const count = brandSongCounts ? brandSongCounts[brand.id] : undefined;
            const isZero = count === 0;

            return (
              <button
                key={brand.id}
                onClick={() => handleBrandClick(brand.id)}
                style={{
                  background: isSelected
                    ? isZero
                      ? 'linear-gradient(135deg, #ef4444, #b91c1c)' // 無資料點擊高亮警示紅
                      : brand.color
                    : isZero
                      ? 'rgba(248, 113, 113, 0.12)' // 無資料未點擊：明亮紅粉警示底
                      : 'rgba(30, 41, 59, 0.75)',
                  color: isSelected
                    ? '#ffffff'
                    : isZero
                      ? '#fca5a5' // 亮紅警示字體
                      : 'var(--text-secondary)',
                  border: `1px solid ${
                    isSelected
                      ? brand.color
                      : isZero
                        ? '#f87171' // ★ 明亮亮紅色外框！一眼辨識無資料狀態
                        : 'rgba(255, 255, 255, 0.12)'
                  }`,
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected || isZero ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 0 16px ${brand.color}88` : isZero ? '0 0 8px rgba(248, 113, 113, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="點擊單選或複選此廠牌比對"
              >
                {isSelected && selectedBrands.length > 1 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✓</span>}
                {brand.shortName}{formatCount(count)}
              </button>
            );
          })}
        </div>

        {/* 向右滾動按鈕 (內容有溢出時才動態顯示) */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="btn-secondary"
            style={{
              borderRadius: '50%',
              width: '32px', height: '32px',
              padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            title="向右滾動廠牌"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* 廠牌顯示數量切換開關 (精簡 vs 展開全部) */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          style={{
            background: isExpanded || isSelectedInSecondary ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isExpanded || isSelectedInSecondary ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '20px',
            padding: '6px 12px',
            color: isExpanded || isSelectedInSecondary ? '#c084fc' : '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          title={isExpanded ? '切換為精簡顯示主廠牌' : `展開更多其他廠牌 (${secondaryCount})`}
        >
          <Layers size={13} />
          <span>{isExpanded || isSelectedInSecondary ? '精簡廠牌' : `更多廠牌 (${secondaryCount})`}</span>
          {isExpanded || isSelectedInSecondary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 🎯 廠牌複選比對列 (Multi-Brand Action Bar) */}
      {selectedBrands.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '10px',
          padding: '6px 14px',
          marginTop: '8px',
          fontSize: '0.8rem',
          color: '#e2e8f0',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#c084fc', fontWeight: 700 }}>🎯 已複選 {selectedBrands.length} 家廠牌比對：</span>
            {selectedBrands.map(bId => {
              const b = BRAND_LIST.find(x => x.id === bId);
              return (
                <span key={bId} style={{
                  background: b?.badgeBg || 'rgba(255,255,255,0.1)',
                  color: b?.color || '#fff',
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem',
                  border: `1px solid ${b?.color}44`,
                }}>
                  {b?.shortName || bId}
                </span>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 匹配模式切換 */}
            {onToggleFilterMode && (
              <button
                onClick={onToggleFilterMode}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  color: brandFilterMode === 'all_of_them' ? '#4ade80' : '#38bdf8',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={brandFilterMode === 'all_of_them' ? '切換為：任一家有收錄 (OR)' : '切換為：全部廠牌均有收錄 (AND)'}
              >
                {brandFilterMode === 'all_of_them' ? '🔗 全部都有收錄 (AND)' : '🔀 任一家有收錄 (OR)'}
              </button>
            )}

            {/* 重置清除 */}
            {onClearBrands && (
              <button
                onClick={onClearBrands}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline',
                }}
              >
                重置全選
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

