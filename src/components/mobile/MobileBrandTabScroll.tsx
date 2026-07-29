import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BrandId } from '../../types/ktv';
import { BRAND_LIST } from '../../data/brands';

interface MobileBrandTabScrollProps {
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  brandFilterMode?: 'any' | 'all_of_them';
  onSelectBrand: (brandId: BrandId | 'all') => void;
  onToggleBrand?: (brandId: BrandId) => void;
  onClearBrands?: () => void;
  onToggleFilterMode?: () => void;
  brandSongCounts?: Record<BrandId, number>;
  totalSongCount?: number;
}

export const MobileBrandTabScroll: React.FC<MobileBrandTabScrollProps> = ({
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // 動態依據【收錄歌曲數量多寡】由大至小排序廠牌標籤
  const displayedBrands = useMemo(() => {
    if (!brandSongCounts) return BRAND_LIST;
    return [...BRAND_LIST].sort((a, b) => {
      const countA = brandSongCounts[a.id] || 0;
      const countB = brandSongCounts[b.id] || 0;
      return countB - countA; // 歌曲數量最多的優先排序
    });
  }, [brandSongCounts]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleTouchEnd = () => {
    setIsMouseDown(false);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const formatCount = (count?: number) => {
    if (count === undefined) return '';
    if (count === 0) return ' (0)';
    if (count >= 10000) return ` (${(count / 10000).toFixed(1)}萬)`;
    if (count >= 1000) return ` (${(count / 1000).toFixed(1)}k)`;
    return ` (${count})`;
  };

  const isMultiSelecting = selectedBrands.length > 0;

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => { clearTimeout(timer); window.removeEventListener('resize', checkScroll); };
  }, [brandSongCounts, totalSongCount, displayedBrands]);

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
    <div style={{ padding: '0 10px 10px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="btn-secondary"
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* 10大 KTV 廠牌全數呈現與觸控滑動 */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '2px 2px 6px', scrollbarWidth: 'none', msOverflowStyle: 'none',
            flex: 1, minWidth: 0, userSelect: 'none', touchAction: 'pan-x',
          }}
        >
          {/* 全部廠牌 Tab */}
          <button
            onClick={handleAllClick}
            style={{
              height: '32px',
              minWidth: '120px',
              width: 'max-content',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: !isMultiSelecting && selectedBrand === 'all'
                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                : 'rgba(30, 41, 59, 0.75)',
              color: '#fff',
              border: `1px solid ${!isMultiSelecting && selectedBrand === 'all' ? 'transparent' : 'rgba(255, 255, 255, 0.12)'}`,
              padding: '0 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxSizing: 'border-box',
            }}
          >
            全部廠牌 (10){formatCount(totalSongCount)}
          </button>

          {/* 10大 KTV 廠牌按鈕 - 動態依【收錄歌曲數量】由多至少優先排序！ */}
          {displayedBrands.map(brand => {
            const isSingleSelected = !isMultiSelecting && selectedBrand === brand.id;
            const isMultiSelected = selectedBrands.includes(brand.id);
            const isSelected = isSingleSelected || isMultiSelected;
            const count = brandSongCounts?.[brand.id];

            return (
              <button
                key={brand.id}
                onClick={() => handleBrandClick(brand.id)}
                style={{
                  height: '32px',
                  minWidth: '92px',
                  width: 'max-content',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected
                    ? `linear-gradient(135deg, ${brand.color}, #8b5cf6)`
                    : 'rgba(30, 41, 59, 0.75)',
                  color: isSelected ? '#ffffff' : brand.color,
                  border: `1px solid ${isSelected ? 'transparent' : `${brand.color}44`}`,
                  padding: '0 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, gap: '4px', boxSizing: 'border-box',
                }}
              >
                <span>{isMultiSelected ? `✓ ${brand.shortName}` : brand.shortName}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{formatCount(count)}</span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="btn-secondary"
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* 🎯 手機端廠牌複選比對列 (Multi-Brand Action Bar) */}
      {selectedBrands.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '10px',
          padding: '6px 10px',
          marginTop: '6px',
          fontSize: '0.76rem',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>複選 ({selectedBrands.length}):</span>
            {selectedBrands.map(bId => {
              const b = BRAND_LIST.find(x => x.id === bId);
              return (
                <span
                  key={bId}
                  onClick={() => handleBrandClick(bId)}
                  style={{
                    background: `${b?.color || '#ec4899'}22`,
                    color: b?.color || '#ec4899',
                    border: `1px solid ${b?.color || '#ec4899'}55`,
                    borderRadius: '12px',
                    padding: '1px 7px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ {b?.shortName || bId}
                </span>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onToggleFilterMode && (
              <button
                onClick={onToggleFilterMode}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  color: brandFilterMode === 'all_of_them' ? '#4ade80' : '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                title={brandFilterMode === 'all_of_them' ? '切換為：任一家有收錄 (OR)' : '切換為：全部廠牌均有收錄 (AND)'}
              >
                {brandFilterMode === 'all_of_them' ? '🔗 全都有(AND)' : '🔀 任一家(OR)'}
              </button>
            )}

            {onClearBrands && (
              <button
                onClick={onClearBrands}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline', whiteSpace: 'nowrap',
                }}
              >
                重置
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
