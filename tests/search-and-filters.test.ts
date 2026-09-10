import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeText, stripPunctuation } from '../src/utils/stringUtils';
import { getSearchRank } from '../src/utils/searchRanking';
import { relaxFilters } from '../src/utils/filterUtils';
import { expandFrontendQuery } from '../src/utils/artistAliases';
import type { FilterOptions } from '../src/types/ktv';

test('combined script, spacing and punctuation queries retain searchable text', () => {
  for (const [a,b] of [['愛 的夢','爱的梦'],['サクラ','サ・クラ'],['사랑해','사랑 해'],['ＬＯＶＥ','love'],['Cafe\u0301','Café']]) assert.equal(normalizeText(a),normalizeText(b),a);
  assert.equal(stripPunctuation('サクラ 사랑해'), 'サクラ사랑해');
  assert.equal(normalizeText('…！？'), '');
});
test('exact title precedes incidental hits without merging versions or singers', () => {
  const songs=[{id:'live',title:'晴天 (Live)',artist:'甲'},{id:'partial',title:'晴',artist:'晴天樂團'},{id:'exact',title:'晴天',artist:'甲'},{id:'other',title:'晴天',artist:'乙'}];
  const ranked=[...songs].sort((a,b)=>getSearchRank(a,'晴天',new Set())-getSearchRank(b,'晴天',new Set()));
  assert.deepEqual(ranked.slice(0,2).map(s=>s.id),['exact','other']);
  assert.equal(new Set(ranked.map(s=>s.id)).size,4);
  assert.notEqual(normalizeText(songs[0].title),normalizeText(songs[2].title));
});
test('existing artist aliases retain priority over incidental text matches', () => {
  const {matchedArtists}=expandFrontendQuery('周董');
  assert.ok(matchedArtists.has('周杰倫'));
  assert.ok(getSearchRank({title:'晴天',artist:'周杰倫'},'周董',matchedArtists)<getSearchRank({title:'周董的歌',artist:'甲'},'周董',matchedArtists));
});
test('relaxing filters preserves query, sorting and original preferences object', () => {
  const original:FilterOptions={searchQuery:'晴天',selectedBrand:'cashbox',selectedBrands:['cashbox'],brandFilterMode:'all_of_them',selectedLanguages:['英語'],selectedTitleLength:'7+',onlyOfficialMv:true,onlyGuidedVocal:true,onlyNicheSongs:true,sortBy:'stroke'};
  const next=relaxFilters(original);
  assert.equal(next.searchQuery,'晴天'); assert.equal(next.sortBy,'stroke'); assert.equal(next.brandFilterMode,'all_of_them');
  assert.equal(next.selectedBrand,'all'); assert.deepEqual(next.selectedBrands,[]); assert.deepEqual(next.selectedLanguages,[]); assert.equal(next.selectedTitleLength,'all');
  assert.equal(next.onlyOfficialMv||next.onlyGuidedVocal||next.onlyNicheSongs,false);
  assert.equal(original.onlyOfficialMv,true); assert.equal(relaxFilters(original,true).searchQuery,'');
});
