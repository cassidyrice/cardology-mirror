import {test} from 'node:test';
import './offer-model.test.mjs';
import assert from 'node:assert/strict';
import {buildDocument,createDraft,readDraft,fileStem} from './report-model.mjs';
import core from '../../lib/engine-core/engine.js';
const input={name:'Sample Client',birthdate:'1991-02-17',readingDate:'2026-10-15',notes:'',includeNotes:true};
test('report anchors and complete boards come from the existing engine',()=>{
  for(const birthdate of ['1991-02-17','2000-02-29','1988-03-14','2000-07-30','1900-02-17']){
    const {report,html}=buildDocument({...input,birthdate});
    assert.equal(report.anchors[0].card,core.getBirthCard(Number(birthdate.slice(5,7)),Number(birthdate.slice(8)))[0]);
    for(const anchor of report.anchors)assert.deepEqual(anchor.walk,core.cardsFrom(anchor.card,report.indexes.period,9));
    for(const board of report.boards)assert.equal(new Set([...board.grid.flat(),...board.crown]).size,52);
    assert.ok(html.includes('Your professional reading'));
  }
});
test('draft round trip regenerates report instead of trusting stored HTML',()=>{
  const original=buildDocument({...input,notes:'Client context: change of work.'});
  const imported=readDraft(JSON.parse(JSON.stringify({...original.draft,html:'<script>bad()</script>'})));
  assert.equal(buildDocument(imported).html,original.html);assert.equal(imported.html,undefined);
  for(const invalid of [{},{...original.draft,version:2},{...original.draft,notes:42},{...original.draft,notes:'a'.repeat(12001)}])assert.throws(()=>readDraft(invalid));
});
test('notes and names remain escaped plain text; excluded notes stay out',()=>{
  const notes='<script>alert(1)</script> & <img src="https://invalid.example">';
  const {html}=buildDocument({...input,name:'<b>Sample</b>',notes});
  assert.ok(html.includes('&lt;b&gt;Sample&lt;/b&gt;'));assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src='));
  assert.ok(!buildDocument({...input,notes,includeNotes:false}).html.includes('&lt;script&gt;'));
  const long=buildDocument({...input,notes:'line\n'.repeat(200)}).html;
  assert.ok((long.match(/class="page reader-notes"/g)||[]).length>1);
});
test('unsupported, invalid and future birth dates cannot be exported',()=>{
  for(const birthdate of ['2000-12-31','2001-02-29','abcd','2999-01-01'])assert.throws(()=>buildDocument({...input,birthdate}));
  assert.throws(()=>buildDocument({...input,readingDate:'1900-01-01'}));
  assert.throws(()=>buildDocument({...input,name:' '}));
  assert.doesNotThrow(()=>createDraft({...input,name:'',birthdate:''}));
  assert.ok(!fileStem({...input,name:'../../evil'}).includes('/'));
});
