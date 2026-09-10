// Persist an intent before mutation, then checkpoint the result before marking the report.
// Retrying the same intent resumes the checkpoint; apply must be idempotent.
export async function runReviewMutation({ record, load, save, apply, finish }) {
  let actions = await load();
  let saved = actions.find(a => a.reviewItemId === record.reviewItemId);
  if (saved && ['adopted', 'rejected'].includes(saved.status)) return saved;
  if (saved && (saved.action !== record.action || saved.targetStatus !== record.targetStatus)) throw Object.assign(new Error('此項目有尚未完成的不同操作，請先恢復原操作'), { statusCode: 409 });
  const write = async () => { const latest = await load(); const index = latest.findIndex(a => a.id === saved.id); if (index < 0) latest.push(saved); else latest[index] = saved; await save(latest); };
  if (!saved) { saved = { ...record, status: 'processing', phase: 'prepared' }; await write(); }
  if (saved.phase === 'prepared') { const updated = await apply(saved); saved = { ...saved, updated, phase: 'applied' }; await write(); }
  await finish(saved);
  saved = { ...saved, status: saved.targetStatus, phase: 'completed' };
  await write();
  return saved;
}

export function serialMiddleware() {
  let tail = Promise.resolve();
  return (_req, res, next) => { const previous = tail; let release; tail = new Promise(resolve => { release = resolve; }); previous.then(() => { if (res.destroyed) { release(); return; } const end = res.end; res.end = function (...args) { try { return end.apply(this, args); } finally { release(); } }; next(); }); };
}
