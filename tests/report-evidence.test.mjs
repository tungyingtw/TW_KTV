import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateReportInput, observationFrom, publicCorrection, brandChanges, sameBrandState, intendedBrandState } from '../server/reportEvidence.js';
import { runReviewMutation } from '../server/reviewMutation.js';

test('optional observations accept legacy reports and reject malformed dates, payloads and links',()=>{
  assert.equal(validateReportInput({}),null); assert.deepEqual(observationFrom(),{observedOn:'',storeName:'',observationType:'unknown'});
  for(const body of [{observedOn:'2026-02-30'},{observedOn:'2999-01-01'},{storeName:[]},{storeName:'a'.repeat(101)},{observationType:'verified'},{youtubeUrl:'javascript:alert(1)'},{mvType:'fake'}])assert.ok(validateReportInput(body,new Date('2026-09-10')));
  assert.equal(validateReportInput({observedOn:'2026-09-09',observationType:'direct',youtubeUrl:'https://example.com/'}),null);
});
test('public facts are an allowlist, require separate publication and never expose private evidence',()=>{
 const action={schemaVersion:1,status:'adopted',id:'a',snapshot:{songId:'s',brandId:'b',ip:'private'},observation:{observedOn:'2026-09-09',observationType:'direct',storeName:'private'},reviewedAt:'2026-09-10',reason:'private',adminId:'private',publication:{visible:true},changes:[{field:'available',before:null,after:true},{field:'note',before:null,after:'private'}]};
 assert.ok(!JSON.stringify(publicCorrection(action)).includes('private'));
 assert.equal(publicCorrection({...action,publication:{visible:false}}),null);assert.equal(publicCorrection({...action,schemaVersion:undefined}),null);assert.equal(publicCorrection({...action,status:'processing'}),null);
 assert.deepEqual(brandChanges(null,{}),[{field:'available',before:null,after:true}]);
 assert.ok(sameBrandState({audioType:undefined},{})); assert.deepEqual(intendedBrandState({available:false},'set_official_mv'),{available:false,mvType:'official_mv'});
});
for(const failure of ['prepare','apply','checkpoint','finish','complete'])test(`review resumes after ${failure} failure without duplicate finalized event`,async()=>{
 let records=[],writes=0,applied=false,finishes=0,failed=false;
 const record={id:'a',reviewItemId:'report:r',action:'set_available',targetStatus:'adopted'};
 const options={record,load:async()=>structuredClone(records),save:async list=>{writes++;if(!failed&&((failure==='prepare'&&writes===1)||(failure==='checkpoint'&&writes===2)||(failure==='complete'&&writes===3))){failed=true;throw Error('disk failed');}records=structuredClone(list);},apply:async()=>{if(failure==='apply'&&!failed){failed=true;throw Error('apply failed');}applied=true;return {after:{available:true}};},finish:async()=>{if(failure==='finish'&&!failed){failed=true;throw Error('report failed');}finishes++;}};
 await assert.rejects(runReviewMutation(options));const result=await runReviewMutation(options);assert.equal(result.status,'adopted');assert.equal(records.length,1);assert.equal(applied,true);const before=finishes;await runReviewMutation(options);assert.equal(finishes,before);
});
test('pending review cannot be replaced by a conflicting decision',async()=>{const existing={id:'a',reviewItemId:'r',status:'processing',action:'set_available',targetStatus:'adopted'};await assert.rejects(runReviewMutation({record:{...existing,action:'reject',targetStatus:'rejected'},load:async()=>[existing]}),/不同操作/);});
