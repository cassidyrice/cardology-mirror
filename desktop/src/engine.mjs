import core from '../../lib/engine-core/engine.js';

export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Enter a complete date.');
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(y,m-1,d); date.setHours(12,0,0,0);
  if (y < 100 || date.getFullYear() !== y || date.getMonth() !== m-1 || date.getDate() !== d) throw new Error('Enter a valid calendar date (year 0100 or later).');
  return date;
}
export function calculate(birthday, targetDate) {
  const birth = parseDate(birthday), target = parseDate(targetDate);
  if (target < birth) throw new Error('Reading date must be on or after the birthday.');
  if (birth.getMonth() === 11 && birth.getDate() === 31) throw new Error('December 31 is the Joker. This engine has no defined Joker spread; a full spread cannot be calculated.');
  const blueprint = core.calculateBlueprint(birth.getMonth()+1,birth.getDate(),birth.getFullYear(),target);
  const annualIndex = blueprint.timing.sy_nav % 90;
  const anchors = [blueprint.archetype.birth_card,blueprint.archetype.prc,blueprint.archetype.prc_secondary].filter(Boolean);
  const spreads = {};
  for (const anchor of new Set(anchors)) {
    const personal = index => {
      const cards = core.cardsFrom(anchor,index,9);
      return {anchor,index,positions:Object.fromEntries([...core.PLANET_NAMES,'Pluto','Result'].map((p,i)=>[p,cards?.[i]??null])),karma:core.getEnvironmentDisplacement(anchor,index)};
    };
    const annual=personal(annualIndex);
    const [planet,,dayInYear]=core.getActivePeriod(birth.getMonth()+1,birth.getDate(),target);
    const periodIndex=Math.max(0,core.PLANET_NAMES.indexOf(planet));
    const dayInPeriod=Math.max(0,dayInYear-(1+periodIndex*52));
    const subIndex=Math.min(6,Math.floor(dayInPeriod/(52/7)));
    const dailyCards=core.cardsFrom(annual.positions[planet],annualIndex,7);
    spreads[anchor] = {annual,life:personal(0),spirit:personal(1),septennial:core.getSeptennial(anchor,blueprint.timing.age),weekly:core.getWeekly(anchor,birth.getFullYear(),birth.getMonth()+1,birth.getDate(),target),daily:{period:planet,subIndex,subPlanet:core.PLANET_NAMES[subIndex],card:dailyCards?.[subIndex]??null,cards:dailyCards},lifetimeKarma:core.getEnvironmentDisplacement(anchor,1)};
  }
  return {birthday,targetDate,blueprint,spreads,boards:Array.from({length:90},(_,i)=>core.getSpread(i)),planets:core.PLANET_NAMES};
}
