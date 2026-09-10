import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { validateReportInput, observationFrom, publicCorrection, sameBrandState, intendedBrandState, brandChanges } from '../server/reportEvidence.js';
import { runReviewMutation, serialMiddleware } from '../server/reviewMutation.js';

// Extract actual handlers without executing server startup, .env loading or Redis connections.
const source = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
const ast = ts.createSourceFile('server.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function handler(path, dependencies) {
  let node;
  function visit(n) { if (ts.isCallExpression(n) && n.expression.getText(ast).startsWith('app.') && n.arguments[0]?.text === path) node = n.arguments.at(-1); ts.forEachChild(n, visit); }
  visit(ast); assert.ok(node, path);
  return Function(...Object.keys(dependencies), `return (${node.getText(ast)})`)(...Object.values(dependencies));
}
const response = () => ({ code: 200, headers: {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, set(k,v) { this.headers[k] = v; return this; } });
test('actual report handler validates input, stores optional evidence and returns receipt only after persistence', async () => {
  let rows = [], fail = false;
  const route = handler('/api/report', { validateReportInput, observationFrom, isUnknownReportBrandId: id => id === '__unknown_brand__', brandExists: async () => true, loadReportsStore: async () => structuredClone(rows), saveReportsStore: async data => { if (fail) throw Error('fixture failure'); rows = data; }, sanitizeText: value => String(value || ''), sanitizeSongSnapshot: () => null, console: { log(){}, error(){} } });
  const request = body => ({ body, headers: {}, socket: { remoteAddress: 'fixture-only' } });
  const body = { songId: 'fixture', songTitle: '測試歌曲', artist: '測試', brandId: '__unknown_brand__', issueType: 'suggest_song' };
  let res = response(); await route(request({ ...body, observedOn: '2026-02-30' }), res); assert.equal(res.code, 400); assert.equal(rows.length, 0);
  res = response(); await route(request(body), res); assert.equal(res.body.success, true); assert.equal(res.body.reportId, rows[0].id); assert.equal(rows[0].observationType, 'unknown'); assert.equal(rows[0].status, 'pending'); assert.equal(res.body.autoResolved, false);
  fail = true; res = response(); await route(request(body), res); assert.equal(res.code, 503); assert.equal(res.body.reportId, undefined); assert.equal(rows.length, 1);
});
test('actual publication and public read handlers keep unpublished records private and allow withdrawal', async () => {
  let rows = [{ id: 'fixture', schemaVersion: 1, status: 'adopted', snapshot: { songId: 'song', brandId: 'brand', note: 'PRIVATE' }, changes: [{ field: 'available', before: null, after: true }], observation: { storeName: 'PRIVATE', observationType: 'direct' }, publication: { visible: false } }];
  const deps = { publicCorrection, loadReviewActionsStore: async () => structuredClone(rows), saveReviewActionsStore: async value => { rows = value; } };
  const read = handler('/api/corrections', deps), publish = handler('/api/admin/review-actions/:actionId/publication', deps);
  let res = response(); await read({ query: { songId: 'song' } }, res); assert.deepEqual(res.body.corrections, []);
  res = response(); await publish({ body: { visible: true }, params: { actionId: 'fixture' }, admin: { id: 'PRIVATE' } }, res); assert.equal(res.body.success, true);
  res = response(); await read({ query: { songId: 'song' } }, res); assert.equal(res.body.corrections.length, 1); assert.equal(JSON.stringify(res.body).includes('PRIVATE'), false); assert.equal(res.headers['Cache-Control'], 'no-store');
  await publish({ body: { visible: false }, params: { actionId: 'fixture' }, admin: { id: 'PRIVATE' } }, response());
  res = response(); await read({ query: { songId: 'song' } }, res); assert.deepEqual(res.body.corrections, []);
});
test('publication requires reports.review and actual permission middleware blocks insufficient permissions', () => {
  const route = ast.statements.find(n => ts.isExpressionStatement(n) && n.expression.arguments?.[0]?.text === '/api/admin/review-actions/:actionId/publication');
  assert.equal(route.expression.arguments[1].getText(ast), "requirePermission('reports.review')");
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'requirePermission');
  const factory = Function('requireSession', `return (${node.getText(ast)})`)((req,res,next) => req.admin ? next() : res.status(401).json({ error: 'fixture auth' }));
  for (const admin of [undefined, { permissions: [] }]) { const res = response(); factory('reports.review')({ admin }, res, () => assert.fail('unauthorized mutation')); assert.equal(res.code, admin ? 403 : 401); }
  let passed = false; factory('reports.review')({ admin: { permissions: ['reports.review'] } }, response(), () => { passed = true; }); assert.equal(passed, true);
});
test('actual resolve rejects unauthorized actions before mutation', async () => {
  const route = handler('/api/admin/review-queue/:reviewItemId/resolve', { loadReviewActionsStore: async () => [], buildReviewItemSnapshotFromId: async () => ({ songId: 'fixture' }), hasAnyPermission: (permissions,required) => required.some(p => permissions.includes(p)) });
  const res = response(); await route({ admin: { permissions: [] }, params: { reviewItemId: 'report:fixture' }, body: { action: 'set_available' } }, res); assert.equal(res.code, 403);
});
test('actual resolve preserves other platforms, links before/after evidence and retries without duplicate writes', async () => {
  let actions = [], writes = 0, failFinish = true, reportStatus = 'pending';
  let song = { id: 'song', title: 'fixture', brands: { a: { audioType: 'guided_vocal' }, b: { available: true } } };
  const route = handler('/api/admin/review-queue/:reviewItemId/resolve', {
    loadReviewActionsStore: async () => structuredClone(actions), saveReviewActionsStore: async data => { actions = structuredClone(data); },
    buildReviewItemSnapshotFromId: async () => ({ sourceType: 'report', sourceId: 'fixture', itemType: 'report', songId: 'song', brandId: 'a', observation: { observedOn: '2026-09-01', observationType: 'direct' } }),
    hasAnyPermission: (permissions,required) => required.some(p => permissions.includes(p)), getAdminSongById: async () => structuredClone(song),
    createReviewActionRecord: data => ({ id: 'action', ...data }), observationFrom, runReviewMutation, sameBrandState, intendedBrandState, brandChanges,
    updateSongBrandStatus: async ({ brandId, available }) => { assert.equal(available, false); writes++; song.brands[brandId] = { available }; return { song, after: song.brands[brandId] }; },
    markReportReviewed: async (_id,status) => { if (failFinish) { failFinish = false; throw Error('fixture report write failure'); } reportStatus = status; }, logAdminAction(){}, console: { error(){} },
  });
  const req = { admin: { permissions: ['reports.review'] }, params: { reviewItemId: 'report:fixture' }, body: { action: 'set_unavailable', payload: { songId: 'spoofed', brandId: 'b' } } };
  let res = response(); await route(req,res); assert.equal(res.code,503); assert.equal(actions[0].phase,'applied'); assert.equal(reportStatus,'pending');
  res = response(); await route(req,res); assert.equal(res.code,200); assert.equal(actions.length,1); assert.equal(writes,1); assert.equal(reportStatus,'resolved'); assert.deepEqual(song.brands.b,{available:true});
  assert.deepEqual(actions[0].changes, [{field:'available',before:true,after:false},{field:'audioType',before:'guided_vocal',after:null}]); assert.equal(actions[0].publication.visible,false);
  await route(req,response()); assert.equal(writes,1);
});
test('write queue holds the next request until response ends even after disconnect', async () => {
  const queue = serialMiddleware(); let started = 0;
  const first = { destroyed: false, end(){} }, second = { destroyed: false, end(){} };
  queue({},first,()=>{started++;}); queue({},second,()=>{started++;});
  await Promise.resolve(); assert.equal(started,1);
  first.destroyed = true; await Promise.resolve(); assert.equal(started,1);
  first.end(); await Promise.resolve(); assert.equal(started,2); second.end();
});
test('retry expectations match actual catalog mutations including a previously absent platform', async () => {
  for (const before of [null, {}, { available: false }, { audioType: 'guided_vocal', mvType: 'live_mv' }]) {
    for (const action of ['set_available','set_unavailable','set_guided_vocal','set_backing_track','set_official_mv','set_reedited_mv']) {
      const songsDatabase = [{ id: 'fixture', brands: before === null ? {} : { a: structuredClone(before) } }];
      const dependencies = { songsDatabase, brandExists: async () => true, saveCatalogOverrideSong: async () => {} };
      const mv = action.includes('_mv');
      const name = mv ? 'updateSongBrandMvType' : 'updateSongBrandStatus';
      const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name);
      const mutate = Function(...Object.keys(dependencies), `return (${node.getText(ast)})`)(...Object.values(dependencies));
      const args = { songId: 'fixture', brandId: 'a', available: action !== 'set_unavailable' };
      if (mv) args.mvType = action === 'set_official_mv' ? 'official_mv' : 'reedited_mv';
      if (action === 'set_guided_vocal') args.audioType = 'guided_vocal';
      if (action === 'set_backing_track') args.audioType = 'backing_track';
      const actual = await mutate(args);
      assert.ok(sameBrandState(actual.after, intendedBrandState(before, action)), `${action}: ${JSON.stringify(before)}`);
    }
  }
});
