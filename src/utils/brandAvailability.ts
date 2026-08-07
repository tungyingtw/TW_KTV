import type { BrandSongStatus } from '../types/ktv';

export function isBrandAvailable(status: BrandSongStatus | undefined | null): boolean {
  return status != null && status.available !== false;
}
