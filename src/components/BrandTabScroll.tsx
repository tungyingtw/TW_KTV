import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BrandId } from '../types/ktv';
import { useBrands } from '../hooks/useBrands';
import { formatCompactZhNumber } from '../utils/stringUtils';

interface BrandTabScrollProps {
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
  const brandList = useBrands();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 滑鼠按住拖曳 state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // 動態依據【收錄歌曲數量多寡】由大至小排序廠牌標籤
  const displayedBrands = useMemo(() => {
    if (!brandSongCounts) return brandList;
    return [...brandList].sort((a, b) => {
      const countA = brandSongCounts[a.id] || 0;
      const countB = brandSongCounts[b.id] || 0;
      return countB - countA; // 歌曲數量最多的優先排序
    });
  }, [brandSongCounts, brandList]);

  // 檢查是否有左右溢出需要顯示捲動按鈕
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [brandSongCounts, totalSongCount, displayedBrands]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  // 滑鼠按住橫動拖曳處理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setHasDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasDragged(true);
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  // 觸控滑動處理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setHasDragged(false);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasDragged(true);
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleTouchEnd = () => {
    setIsMouseDown(false);
  };

  // 滑鼠滾輪橫向滾動
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const formatCount = (count?: number) => {
    if (count === undefined) return '';
    return ` (${formatCompactZhNumber(count)})`;
  };

  const isMultiSelecting = selectedBrands.length > 0;
  const brandMatchLabel = brandFilterMode === 'all_of_them' ? '必須同時收錄於已選品牌' : '符合任一已選品牌';
  const brandToggleLabel = brandFilterMode === 'all_of_them' ? '改成任一品牌有收錄即可' : '改成所有已選品牌都要收錄';

  const handleBrandClick = (brandId: BrandId) => {
    if (hasDragged) return;
    if (onToggleBrand) {
      onToggleBrand(brandId);
    } else {
      onSelectBrand(brandId);
    }
  };

  const handleAllClick = () => {
    if (hasDragged) return;
    if (onClearBrands) onClearBrands();
    onSelectBrand('all');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto 10px auto', padding: '0 20px', position: 'relative' }}>
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

        {/* 廠牌 Tab 可滾動區域 */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
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
            className={`brand-chip ${!isMultiSelecting && selectedBrand === 'all' ? 'is-selected' : ''}`}
            onClick={handleAllClick}
            style={{
              height: '36px',
              minWidth: '150px',
              width: 'max-content',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: !isMultiSelecting && selectedBrand === 'all'
                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                : 'rgba(30, 41, 59, 0.75)',
              color: '#fff',
              border: `1px solid ${!isMultiSelecting && selectedBrand === 'all' ? 'transparent' : 'rgba(255, 255, 255, 0.12)'}`,
              padding: '0 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: !isMultiSelecting && selectedBrand === 'all' ? '0 0 16px rgba(236, 72, 153, 0.45)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            全部廠牌 ({brandList.length}){totalSongCount ? ` · ${formatCompactZhNumber(totalSongCount)}首` : ''}
          </button>

          {/* KTV 廠牌 - 動態依【收錄歌曲數量】由多至少優先排序！ */}
          {displayedBrands.map(brand => {
            const isSelected = selectedBrands.includes(brand.id) || (!isMultiSelecting && selectedBrand === brand.id);
            const count = brandSongCounts ? brandSongCounts[brand.id] : undefined;
            const isZero = count === 0;

            return (
              <button
                className={`brand-chip ${isSelected ? 'is-selected' : ''}`}
                key={brand.id}
                onClick={() => handleBrandClick(brand.id)}
                style={{
                  height: '36px',
                  minWidth: '108px',
                  width: 'max-content',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected
                    ? isZero
                      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                      : `linear-gradient(135deg, ${brand.color}, #8b5cf6)`
                    : isZero
                      ? 'rgba(248, 113, 113, 0.12)'
                      : 'rgba(30, 41, 59, 0.75)',
                  color: isSelected
                    ? '#ffffff'
                    : isZero
                      ? '#fca5a5'
                      : brand.color,
                  border: `1px solid ${
                    isSelected
                      ? brand.color
                      : isZero
                        ? '#f87171'
                        : `${brand.color}44`
                  }`,
                  padding: '0 14px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected || isZero ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 0 16px ${brand.color}88` : isZero ? '0 0 8px rgba(248, 113, 113, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  boxSizing: 'border-box',
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

        {/* 向右滾動按鈕 */}
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
      </div>

      {selectedBrands.length > 0 && (
        <div className="brand-selection-summary" style={{
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: '#c084fc', fontWeight: 700 }}>已選 {selectedBrands.length} 家品牌：</span>
            {selectedBrands.map(bId => {
              const b = brandList.find(x => x.id === bId);
              return (
                <span key={bId} className="brand-selection-token" style={{
                  background: b?.badgeBg || 'rgba(255,255,255,0.1)',
                  color: b?.color || '#fff',
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem',
                  border: `1px solid ${b?.color}44`,
                }}>
                  {b?.shortName || bId}
                </span>
              );
            })}
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>目前條件：{brandMatchLabel}</span>
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
                title={brandToggleLabel}
              >
                {brandFilterMode === 'all_of_them' ? '同時收錄' : '任一收錄'}
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
                清除品牌篩選
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
