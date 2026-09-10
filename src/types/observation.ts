export interface Observation { observedOn: string; storeName: string; observationType: 'direct' | 'hearsay' | 'unknown' }
export const emptyObservation: Observation = { observedOn: '', storeName: '', observationType: 'unknown' };
