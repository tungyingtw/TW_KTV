import type { BrandSongStatus, VoteData } from '../types/ktv';
import { isBrandAvailable } from './brandAvailability';

const hasPositiveConsensus = (positive = 0, negative = 0): boolean => positive >= 1 && positive > negative;

export function hasCommunityAvailability(vote?: VoteData): boolean {
  return hasPositiveConsensus(vote?.confirm, vote?.deny);
}

export function hasCommunityGuidedVocal(vote?: VoteData): boolean {
  return hasPositiveConsensus(vote?.guidedVocal, vote?.noGuidedVocal);
}

export function hasCommunityOfficialMv(vote?: VoteData): boolean {
  return hasPositiveConsensus(vote?.officialMv, vote?.editedMv);
}

export function isStatusAvailableWithCommunity(status?: BrandSongStatus, vote?: VoteData): boolean {
  return isBrandAvailable(status) || hasCommunityAvailability(vote);
}

export function getAvailabilityLabel(status?: BrandSongStatus, vote?: VoteData): string {
  if (isStatusAvailableWithCommunity(status, vote)) return '有收錄';
  return hasPositiveConsensus(vote?.deny, vote?.confirm) ? '回報偏向未收錄' : '尚未確認';
}

export function shouldShowGuidedVocal(status?: BrandSongStatus, vote?: VoteData): boolean {
  return status?.audioType === 'guided_vocal' || hasCommunityGuidedVocal(vote);
}

export function shouldShowOfficialMv(status?: BrandSongStatus, vote?: VoteData): boolean {
  return status?.mvType === 'official_mv' || hasCommunityOfficialMv(vote);
}
