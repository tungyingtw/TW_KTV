import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisitStatsPanel } from '../src/components/VisitStatsPanel';

const props = { totalVisits: 0, userRegionId: '', selectedRegion: undefined, selectedVisits: 0, selectedPercent: '0.0', sortedRegions: [{ id: 'TWTPE', name: '台北市', d: 'M0 0' }], visitCounts: {}, regionLabels: {}, onSelectRegion() {}, onJoinSelectedRegion() {} };
test('daily loading and failure do not imply zero visits', () => {
  const loading = renderToStaticMarkup(createElement(VisitStatsPanel, { ...props, isDailyStatsLoading: true }));
  assert.ok(loading.includes('今日讀取中'));
  assert.ok(!loading.includes('今日 0'));
  const failed = renderToStaticMarkup(createElement(VisitStatsPanel, { ...props, dailyStatsError: '讀取失敗', onRetryDailyStats() {} }));
  assert.ok(failed.includes('今日暫無資料'));
  assert.ok(failed.includes('重試'));
  assert.ok(!failed.includes('今日 0'));
});
test('empty rankings and large daily counts remain honest and readable', () => {
  const html = renderToStaticMarkup(createElement(VisitStatsPanel, { ...props, dailyStats: [{ date: '2026-09-14', count: 1200 }], todayCount: 1200 }));
  assert.ok(html.includes('尚無縣市到訪紀錄'));
  assert.ok(html.includes('1.2千'));
  assert.ok(html.includes('1,200 人次'));
  assert.ok(html.includes('08:00'));
});
