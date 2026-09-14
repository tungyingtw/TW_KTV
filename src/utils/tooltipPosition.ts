export function tooltipPosition(x: number, y: number, width: number, height: number, viewportWidth: number, viewportHeight: number) {
  const gap = 14, margin = 8;
  const fit = (value: number, size: number, viewport: number) => Math.max(margin, Math.min(value, viewport - size - margin));
  return {
    left: fit(x + gap + width <= viewportWidth - margin ? x + gap : x - width - gap, width, viewportWidth),
    top: fit(y + gap + height <= viewportHeight - margin ? y + gap : y - height - gap, height, viewportHeight),
  };
}
