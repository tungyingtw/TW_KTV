import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisitStatsPanel } from '../src/components/VisitStatsPanel';
import { tooltipPosition } from '../src/utils/tooltipPosition';

test('site visits and regional records remain distinct, including unavailable totals', () => {
  const base = { totalVisits: 80, userRegionId: '', selectedRegion: { id: 'TWTPE', name: '台北市', d: 'M0 0' }, selectedVisits: 40, selectedPercent: '50.0', sortedRegions: [], visitCounts: {}, regionLabels: {}, onSelectRegion: () => {}, onJoinSelectedRegion: () => {} };
  const html = renderToStaticMarkup(createElement(VisitStatsPanel, { ...base, siteVisits: { total: 12345, persistent: true, error: false } }));
  assert.ok(html.includes('12,345'));
  assert.ok(!html.includes('已記錄地區：80'));
  assert.ok(html.includes('占地區紀錄 50.0%'));
  const unavailable = renderToStaticMarkup(createElement(VisitStatsPanel, { ...base, siteVisits: { total: null, persistent: true, error: true } }));
  assert.ok(unavailable.includes('<strong>暫時無法讀取</strong>'));
  assert.ok(!unavailable.includes('<strong>80'));
});

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
test('tooltip follows the pointer and flips above/left at viewport boundaries', () => {
  assert.deepEqual(tooltipPosition(100, 100, 170, 60, 1000, 700), { left: 114, top: 114 });
  const lower = tooltipPosition(613, 674, 170, 60, 1274, 720);
  assert.equal(lower.top, 600);
  assert.ok(lower.top + 60 < 674);
  const edge = tooltipPosition(990, 690, 170, 60, 1000, 700);
  assert.deepEqual(edge, { left: 806, top: 616 });
  assert.deepEqual(tooltipPosition(0, 0, 170, 60, 180, 70), { left: 8, top: 8 });
});
test('an old final date is not labelled today and empty daily responses do not imply zero', () => {
  const old = renderToStaticMarkup(createElement(VisitStatsPanel, { ...props, dailyStats: [{ date: '2000-01-01', count: 1 }] }));
  assert.ok(!old.includes('is-today'));
  const empty = renderToStaticMarkup(createElement(VisitStatsPanel, props));
  assert.ok(empty.includes('今日暫無資料'));
});
