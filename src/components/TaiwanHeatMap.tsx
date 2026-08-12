import { useRef, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';

export type RegionPath = {
  id: string;
  name: string;
  d: string;
};

export type RegionPulse = {
  id: number;
  regionId: string;
  delta: 1 | -1;
};

type PointerState = {
  x: number;
  y: number;
  region: RegionPath;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  candidateRegionId: string | null;
  didDrag: boolean;
};

type TaiwanHeatMapProps = {
  regions: RegionPath[];
  selectedRegion: RegionPath | undefined;
  selectedId: string | null;
  userRegionId: string;
  visitCounts: Record<string, number>;
  maxVisits: number;
  regionLabels: Record<string, string>;
  regionPulses: RegionPulse[];
  onSelectRegion: (regionId: string | null) => void;
  onJoinSelectedRegion: () => void;
  showJoinAction?: boolean;
  joinActionDisabled?: boolean;
  joinActionLabel?: string;
  actionMessage?: string;
};

const FULL_TAIWAN_VIEW_BOX = '0 0 1000 1000';
const DEFAULT_MAP_SCALE = 1.04;
const DEFAULT_MAP_OFFSET_X = -32;
const DEFAULT_MAP_OFFSET_Y = 10;
const MAP_OFFSET_X_LIMIT = 260;
const MAP_OFFSET_Y_LIMIT = 160;

const REGION_ANCHOR_POINTS: Record<string, { x: number; y: number }> = {
  TWKIN: { x: 153.8, y: 422.9 },
  TWLIE: { x: 472.2, y: 56.8 },
  TWPEN: { x: 396, y: 612.1 },
  TWTAO: { x: 703.6, y: 320.4 },
  TWHSQ: { x: 693.7, y: 378.3 },
  TWHSZ: { x: 652.4, y: 360.1 },
  TWMIA: { x: 640.8, y: 418.8 },
  TWTXG: { x: 604.9, y: 482.7 },
  TWCHA: { x: 565, y: 532.6 },
  TWYUN: { x: 542.6, y: 581.1 },
  TWCYQ: { x: 598.2, y: 640.2 },
  TWTNN: { x: 536.2, y: 699.7 },
  TWKHH: { x: 605.1, y: 724.8 },
  TWPIF: { x: 585.7, y: 821.9 },
  TWTTT: { x: 675.1, y: 732.1 },
  TWHUA: { x: 739, y: 565 },
  TWILA: { x: 783.8, y: 406.8 },
  TWNWT: { x: 763.3, y: 342.8 },
  TWKEE: { x: 796.7, y: 291.6 },
  TWNAN: { x: 658.6, y: 552 },
  TWTPE: { x: 768.5, y: 297.9 },
  TWCYI: { x: 556.7, y: 630.5 },
};

function formatCount(value: number) {
  return value.toLocaleString('zh-TW');
}

function getHeatColor(value: number, max: number) {
  const ratio = max > 0 ? value / max : 0;
  if (ratio > 0.78) return '#fb7185';
  if (ratio > 0.58) return '#f59e0b';
  if (ratio > 0.38) return '#a78bfa';
  if (ratio > 0.2) return '#38bdf8';
  return '#64748b';
}

export function TaiwanHeatMap({
  regions,
  selectedRegion,
  selectedId,
  userRegionId,
  visitCounts,
  maxVisits,
  regionLabels,
  regionPulses,
  onSelectRegion,
  onJoinSelectedRegion,
  showJoinAction = true,
  joinActionDisabled,
  joinActionLabel,
  actionMessage,
}: TaiwanHeatMapProps) {
  const [pointer, setPointer] = useState<PointerState | null>(null);
  const [mapScale, setMapScale] = useState(DEFAULT_MAP_SCALE);
  const [mapOffsetX, setMapOffsetX] = useState(DEFAULT_MAP_OFFSET_X);
  const [mapOffsetY, setMapOffsetY] = useState(DEFAULT_MAP_OFFSET_Y);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapSvgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const mapTransformRef = useRef({
    scale: DEFAULT_MAP_SCALE,
    offsetX: DEFAULT_MAP_OFFSET_X,
    offsetY: DEFAULT_MAP_OFFSET_Y,
  });
  const userRegionAnchor = userRegionId ? REGION_ANCHOR_POINTS[userRegionId] : undefined;

  const applyMapTransform = (next: { scale: number; offsetX: number; offsetY: number }, syncState = true) => {
    mapTransformRef.current = next;
    if (mapSvgRef.current) mapSvgRef.current.style.transform = `translate3d(${next.offsetX}px, ${next.offsetY}px, 0) scale(${next.scale})`;
    if (!syncState) return;
    setMapScale(next.scale);
    setMapOffsetX(next.offsetX);
    setMapOffsetY(next.offsetY);
  };

  const resetMapView = () => {
    applyMapTransform({
      scale: DEFAULT_MAP_SCALE,
      offsetX: DEFAULT_MAP_OFFSET_X,
      offsetY: DEFAULT_MAP_OFFSET_Y,
    });
  };

  const getRegionIdFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return target.closest<SVGPathElement>('[data-region-id]')?.dataset.regionId || null;
  };

  const handleMapPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    mapWrapRef.current?.setPointerCapture(event.pointerId);
    mapWrapRef.current?.classList.add('is-dragging');
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: mapOffsetX,
      startOffsetY: mapOffsetY,
      candidateRegionId: getRegionIdFromTarget(event.target),
      didDrag: false,
    };
  };

  const handleMapPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) drag.didDrag = true;
    if (!drag.didDrag) return;

    event.preventDefault();
    setPointer(null);
    applyMapTransform({
      scale: mapTransformRef.current.scale,
      offsetX: Math.max(-MAP_OFFSET_X_LIMIT, Math.min(MAP_OFFSET_X_LIMIT, drag.startOffsetX + deltaX)),
      offsetY: Math.max(-MAP_OFFSET_Y_LIMIT, Math.min(MAP_OFFSET_Y_LIMIT, drag.startOffsetY + deltaY)),
    }, false);
  };

  const handleMapPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    mapWrapRef.current?.releasePointerCapture(event.pointerId);
    mapWrapRef.current?.classList.remove('is-dragging');
    dragStateRef.current = null;

    if (drag.didDrag) {
      const { scale, offsetX, offsetY } = mapTransformRef.current;
      setMapScale(scale);
      setMapOffsetX(offsetX);
      setMapOffsetY(offsetY);
      return;
    }
    onSelectRegion(drag.candidateRegionId);
  };

  return (
    <div className="taiwan-demo-panel taiwan-demo-map-panel">
      <div className="taiwan-demo-panel-head">
        <div>
          <span>Taiwan Heat Map</span>
          <h2>縣市熱度</h2>
        </div>
        <div className="taiwan-demo-live"><Activity size={15} /> 歌友分布</div>
      </div>

      <div className="taiwan-demo-map-tools" aria-label="地圖檢視控制">
        <button type="button" onClick={() => applyMapTransform({ scale: mapScale, offsetX: Math.min(mapOffsetX + 42, MAP_OFFSET_X_LIMIT), offsetY: mapOffsetY })} aria-label="地圖向右移"><ChevronLeft size={16} /></button>
        <button type="button" onClick={() => applyMapTransform({ scale: Math.max(0.92, Number((mapScale - 0.1).toFixed(2))), offsetX: mapOffsetX, offsetY: mapOffsetY })} aria-label="縮小地圖"><Minus size={16} /></button>
        <button type="button" onClick={resetMapView} aria-label="重設地圖視角"><RotateCcw size={16} /></button>
        <button type="button" onClick={() => applyMapTransform({ scale: Math.min(1.82, Number((mapScale + 0.1).toFixed(2))), offsetX: mapOffsetX, offsetY: mapOffsetY })} aria-label="放大地圖"><Plus size={16} /></button>
        <button type="button" onClick={() => applyMapTransform({ scale: mapScale, offsetX: Math.max(mapOffsetX - 42, -MAP_OFFSET_X_LIMIT), offsetY: mapOffsetY })} aria-label="地圖向左移"><ChevronRight size={16} /></button>
      </div>
      <div className="taiwan-demo-legend" aria-label="顏色分布說明">
        <span>少</span>
        <i style={{ background: '#64748b' }} />
        <i style={{ background: '#38bdf8' }} />
        <i style={{ background: '#a78bfa' }} />
        <i style={{ background: '#f59e0b' }} />
        <i style={{ background: '#fb7185' }} />
        <span>多</span>
      </div>

      <div
        ref={mapWrapRef}
        className="taiwan-demo-map-wrap"
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerUp}
        onPointerCancel={() => {
          dragStateRef.current = null;
          setPointer(null);
          mapWrapRef.current?.classList.remove('is-dragging');
        }}
        onMouseLeave={() => setPointer(null)}
      >
        <svg
          ref={mapSvgRef}
          className={selectedRegion ? 'taiwan-demo-map has-selection' : 'taiwan-demo-map'}
          style={{ transform: `translate3d(${mapOffsetX}px, ${mapOffsetY}px, 0) scale(${mapScale})` }}
          viewBox={FULL_TAIWAN_VIEW_BOX}
          role="img"
          aria-label="台灣縣市歌友熱度分布"
        >
          <defs>
            <filter id="taiwan-demo-soft-glow">
              <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#38bdf8" floodOpacity="0.28" />
              <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#020617" floodOpacity="0.45" />
            </filter>
          </defs>
          <g>
            {regions.filter((region) => region.id !== selectedId).map((region) => {
              const visits = visitCounts[region.id] || 0;
              return (
                <path
                  key={region.id}
                  data-region-id={region.id}
                  d={region.d}
                  className={selectedRegion ? 'is-dimmed' : ''}
                  fill={getHeatColor(visits, maxVisits)}
                  opacity={0.46 + (visits / maxVisits) * 0.48}
                  onMouseMove={(event) => setPointer({ x: event.clientX, y: event.clientY, region })}
                  tabIndex={0}
                  role="button"
                  aria-label={`${regionLabels[region.id] || region.name}，${formatCount(visits)} 人`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelectRegion(region.id);
                  }}
                />
              );
            })}
            {selectedRegion && (
              <path
                key={`selected-${selectedRegion.id}`}
                data-region-id={selectedRegion.id}
                d={selectedRegion.d}
                className="is-selected"
                fill={getHeatColor(visitCounts[selectedRegion.id] || 0, maxVisits)}
                onMouseMove={(event) => setPointer({ x: event.clientX, y: event.clientY, region: selectedRegion })}
                tabIndex={0}
                role="button"
                aria-label={`${regionLabels[selectedRegion.id] || selectedRegion.name}，${formatCount(visitCounts[selectedRegion.id] || 0)} 人`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelectRegion(selectedRegion.id);
                }}
              />
            )}
            <g className="taiwan-demo-region-pulses" aria-hidden="true">
              {regionPulses.map((pulse) => {
                const anchor = REGION_ANCHOR_POINTS[pulse.regionId];
                if (!anchor) return null;
                return (
                  <text key={pulse.id} x={anchor.x} y={anchor.y} className={pulse.delta > 0 ? 'is-plus' : 'is-minus'}>
                    {pulse.delta > 0 ? '+1' : '-1'}
                  </text>
                );
              })}
            </g>
            {userRegionAnchor && (
              <g className="taiwan-demo-user-marker" transform={`translate(${userRegionAnchor.x} ${userRegionAnchor.y})`} aria-hidden="true">
                <circle r="17" />
                <circle r="6" />
                <text y="-24">你在這裡</text>
              </g>
            )}
          </g>
        </svg>
        {pointer && (
          <div className="taiwan-demo-tooltip" style={{ left: pointer.x + 14, top: pointer.y + 14 }}>
            <strong>{regionLabels[pointer.region.id] || pointer.region.name}</strong>
            <span>{formatCount(visitCounts[pointer.region.id] || 0)} 人</span>
          </div>
        )}
        {selectedRegion && showJoinAction && (
          <div
            className="taiwan-demo-map-action"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <span>目前選取</span>
              <strong>{regionLabels[selectedRegion.id] || selectedRegion.name}</strong>
            </div>
            <button
              type="button"
              className="taiwan-demo-join-button"
              disabled={joinActionDisabled ?? selectedRegion.id === userRegionId}
              onClick={onJoinSelectedRegion}
            >
              {joinActionLabel || (selectedRegion.id === userRegionId ? '已在這裡' : '我在這裡')}
            </button>
            {actionMessage && <em>{actionMessage}</em>}
          </div>
        )}
      </div>
    </div>
  );
}
