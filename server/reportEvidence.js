export function validateReportInput(body, now = new Date()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '回報格式不正確';
  const limits={songId:160,songTitle:200,artist:200,brandId:80,issueType:40,lang:30,lyricist:200,composer:200,note:1000,lyricsSnippet:500,youtubeUrl:500,brandName:100,shortName:100,systemType:100,storeLocations:500,helperNickname:24,storeName:100,observedOn:10,observationType:10};
  for(const [key,max] of Object.entries(limits)) if(body[key]!==undefined && (typeof body[key]!=='string'||body[key].length>max)) return `欄位 ${key} 格式或長度不正確`;
  if(body.observationType!==undefined&&!['direct','hearsay','unknown'].includes(body.observationType))return '請選擇資訊取得方式';
  if(body.observedOn){const date=new Date(`${body.observedOn}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(body.observedOn)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==body.observedOn||date.getTime()>now.getTime()+86400000)return '確認日期不正確';}
  if(body.youtubeUrl){try{const url=new URL(body.youtubeUrl);if(!['https:','http:'].includes(url.protocol))return '參考網址須使用 http 或 https';}catch{return '參考網址格式不正確';}}
  if(body.mvType!==undefined&&!['official','edited','unknown'].includes(body.mvType))return 'MV 類型不正確';
  if(body.guidedVocalStatus!==undefined&&!['guided','none','unknown'].includes(body.guidedVocalStatus))return '導唱類型不正確';
  return null;
}

export function observationFrom(report = {}) {
  return { observedOn: typeof report.observedOn==='string'?report.observedOn:'', storeName: typeof report.storeName==='string'?report.storeName:'', observationType:['direct','hearsay','unknown'].includes(report.observationType)?report.observationType:'unknown' };
}

export function publicCorrection(action) {
  if(action.schemaVersion!==1||action.status!=='adopted'||action.publication?.visible!==true||!Array.isArray(action.changes)||!action.changes.length)return null;
  const allowed={available:[true,false,null],audioType:['guided_vocal','backing_track','unknown',null],mvType:['official_mv','reedited_mv','unknown',null]};
  const changes=action.changes.filter(c=>allowed[c.field]?.includes(c.before)&&allowed[c.field]?.includes(c.after)).map(c=>({field:c.field,before:c.before,after:c.after}));
  if(!changes.length)return null;
  // Only curated song identifiers and typed facts; never expose raw reports, reasons or operator data.
  return {id:action.id,songId:action.snapshot?.songId,brandId:action.snapshot?.brandId,reviewedAt:action.reviewedAt,observedOn:action.observation?.observedOn||null,observationType:action.observation?.observationType||'unknown',changes};
}

export function brandChanges(before, after) {
  const value=(status,field)=>field==='available'?(status==null?null:status.available===false?false:true):(status?.[field]||null);
  return ['available','audioType','mvType'].map(field=>({field,before:value(before,field),after:value(after,field)})).filter(c=>c.before!==c.after);
}

export function sameBrandState(a, b) {
  const canonical=value=>value==null?null:Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([x],[y])=>x.localeCompare(y)));
  return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
}
export function intendedBrandState(before, action) {
  const next={...(before ?? (['set_official_mv','set_reedited_mv'].includes(action) ? {available:false} : {}))};
  if(action==='set_unavailable'){next.available=false;delete next.audioType;delete next.mvType;return next;}
  if (!['set_official_mv','set_reedited_mv'].includes(action)) delete next.available;
  if(action==='set_guided_vocal')next.audioType='guided_vocal';
  if(action==='set_backing_track')next.audioType='backing_track';
  if(action==='set_official_mv')next.mvType='official_mv';
  if(action==='set_reedited_mv')next.mvType='reedited_mv';
  return next;
}
