import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tooltipPosition } from '../utils/tooltipPosition';

export function MapTooltip({ x, y, label, count }: { x: number; y: number; label: string; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 170, height: 60 });
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setSize({ width: rect.width, height: rect.height });
  }, [label, count]);
  const position = tooltipPosition(x, y, size.width, size.height, window.innerWidth, window.innerHeight);
  return createPortal(
    <div ref={ref} role="tooltip" className="taiwan-demo-tooltip" style={{ ...position, zIndex: 2000, width: 170, maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box' }}>
      <strong>{label}</strong><span>{count.toLocaleString('zh-TW')} 人次</span>
    </div>, document.body,
  );
}
