import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDocument,createDraft,readDraft,OFFERS} from './offer-model.mjs';
import core from '../../lib/engine-core/engine.js';
const people=[{name:'Sample Client',birthdate:'1991-02-17',relation:'Buyer'},{name:'Sample Partner',birthdate:'1990-06-12',relation:'Partner'},{name:'Sample Friend',birthdate:'1988-09-23',relation:'Friend'},{name:'Sample Relative',birthdate:'2000-02-29',relation:'Sibling'}];
const draft=offer=>({offer,readingDate:'2026-10-15',people:people.slice(0,OFFERS[offer].people),sections:['','','',''],notes:'',includeNotes:true,reviewed:false});
test('each current offer covers a complete year with contiguous engine-derived periods',()=>{
  for(const offer of ['timing-map','chemistry','family']){
    const {engine,html}=buildDocument(draft(offer));
    assert.equal(engine.people.length,OFFERS[offer].people);assert.equal(engine.window.end,'2027-10-14');
    for(const person of engine.people){
      assert.equal(person.windows[0].start,engine.window.start);assert.equal(person.windows.at(-1).end,engine.window.end);
      assert.ok(person.cycles.length>=2);
      for(let i=1;i<person.windows.length;i++)assert.equal(Date.parse(person.windows[i].start)-Date.parse(person.windows[i-1].end),86400000);
      for(const cycle of person.cycles)for(const anchor of cycle.anchors)assert.deepEqual(anchor.walk,core.cardsFrom(anchor.card,cycle.indexes.period,9));
      assert.ok(html.includes(person.name));
    }
    assert.ok(html.includes('CARD BLUEPRINTS / '));assert.ok(html.includes('aria-label="Card Blueprint"'));assert.ok(html.includes('Reader review draft'));
    assert.ok(html.includes('data:image/png;base64,'));
  }
});
test('cross-person facts are exact matches with genuine date intersections',()=>{
  const {engine}=buildDocument(draft('family'));
  for(const item of engine.identityLinks){
    const a=engine.people.find(p=>p.id===item.a),b=engine.people.find(p=>p.id===item.b);
    assert.equal(a.identity.find(i=>i.role===item.aRole).card,item.card);assert.equal(b.identity.find(i=>i.role===item.bRole).card,item.card);
  }
  for(const item of engine.appearances){
    const a=engine.people.find(p=>p.id===item.source),b=engine.people.find(p=>p.id===item.target);
    assert.equal(a.identity.find(i=>i.role===item.sourceRole).card,item.card);
    assert.ok(b.cycles.some(c=>c.anchors.some(anchor=>anchor.id===item.targetAnchor&&[...anchor.walk,anchor.longRangeCard,anchor.annual?.environment,anchor.annual?.displacement].includes(item.card))));
    assert.ok(item.start<=item.end&&item.start>=engine.window.start&&item.end<=engine.window.end);
  }
  for(const item of engine.overlaps){
    for(const id of [item.a,item.b])assert.ok(engine.people.find(p=>p.id===id).windows.some(w=>w.start<=item.start&&w.end>=item.end&&w.cards[0].card===item.card));
  }
});
test('leap birthdays, DST transitions, fixed cards, and unsupported dates remain explicit',()=>{
  const value=draft('chemistry');value.people[0]={name:'Leap Sample',birthdate:'2000-02-29',relation:'Buyer'};value.readingDate='2027-02-28';
  const {engine}=buildDocument(value);assert.equal(engine.people[0].cycles[0].start,'2027-02-28');
  assert.equal(engine.people[0].windows[0].start,'2027-02-28');
  for(const invalid of ['2000-12-31','2001-02-29','2999-01-01',''])assert.throws(()=>buildDocument({...value,people:[{...value.people[0],birthdate:invalid},value.people[1]]}));
  assert.throws(()=>buildDocument({...value,people:[value.people[0]]}));
});
test('all writing is escaped; draft inputs round-trip and legacy drafts migrate',()=>{
  const value=draft('timing-map');value.sections[0]='<script>unsafe()</script>';value.notes='<img src=x onerror=bad()>';
  const built=buildDocument(value);assert.ok(!built.html.includes('<script>'));assert.ok(built.html.includes('&lt;script&gt;'));
  assert.deepEqual(readDraft(JSON.parse(JSON.stringify(built.draft))),built.draft);
  assert.ok(!buildDocument({...value,includeNotes:false}).html.includes('&lt;img'));
  const migrated=readDraft({format:'card-blueprints-report',version:1,name:'Sample',birthdate:'1991-02-17',readingDate:'2026-10-15',notes:'',includeNotes:true});assert.equal(migrated.offer,'professional');
  assert.throws(()=>createDraft({...value,sections:['a']}));
});
