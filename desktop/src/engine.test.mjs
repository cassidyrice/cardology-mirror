import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from './engine.mjs';
import core from '../../lib/engine-core/engine.js';
test('all calendar birthdays and all 90 boards retain exact core positions',()=>{
  for(let m=1;m<=12;m++) for(let d=1;d<=new Date(2000,m,0).getDate();d++) {
    if(m===12&&d===31)continue;
    const birthday=`2000-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const r=calculate(birthday,'2026-10-14');
    assert.equal(r.blueprint.archetype.birth_card,core.getBirthCard(m,d)[0]);
    for(const s of Object.values(r.spreads)) assert.deepEqual(Object.values(s.annual.positions),core.cardsFrom(s.annual.anchor,s.annual.index,9));
  }
  for(const board of calculate('1991-02-17','2026-10-14').boards)assert.equal(new Set([...board.grid.flat(),...board.crown]).size,52);
});
test('invalid dates, future births and Joker are explicit errors',()=>{
  for(const date of ['2001-02-29','2026-13-01','abc','2027-01-01','2000-12-31'])assert.throws(()=>calculate(date,'2026-10-14'));
  assert.doesNotThrow(()=>calculate('2000-02-29','2026-10-14'));
});
test('ages beyond 90 cycle rather than clamp; fixed cards retain null karma',()=>{
  const r=calculate('1900-02-17','2026-10-14');
  assert.equal(r.blueprint.timing.age,126);
  assert.equal(r.spreads[r.blueprint.archetype.birth_card].annual.index,37);
  for(const date of ['2000-07-30','2000-08-29']) {
    const x=calculate(date,'2026-10-14');
    if(['J♥','8♣','K♠'].includes(x.blueprint.archetype.birth_card))assert.equal(x.blueprint.karma.bc_lifetime,null);
  }
});
