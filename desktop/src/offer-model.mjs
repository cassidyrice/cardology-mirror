import {buildProfessionalReading} from '../../scripts/professional-reading/builder.ts';
import meanings from '../../lib/card-meanings.json';
import descriptions from '../../lib/engine-data/card-descriptions.json';
import {renderOfferReport} from './offer-render.mjs';
import {buildDocument as buildLegacy,readDraft as readLegacy,fileStem as legacyStem} from './report-model.mjs';

export const OFFERS={
  'timing-map':{name:'Your 12-Month Timing Map',people:3,parts:['Your Personal Pacing & Core Wiring','Who Shows Up in Your Year'],sections:['Your Baseline & Yearly Theme','Your Seven Personal Seasons','Your Shared Friction & Flow','When They Cross Your Path']},
  chemistry:{name:'The Chemistry Check',people:2,parts:['The Core Dynamic','Your Current Year Together'],sections:['How You’re Both Wired','Where You Click & Where You Clash','Where You Are Right Now','Where You Show Up in Each Other’s Year']},
  family:{name:'The Family Snapshot',people:4,parts:['The Family Wiring','This Year’s Family Radar'],sections:['How Everyone Is Built','The Alignments & Fault Lines','Where Everyone Shows Up in Your Year','Breaking the Pattern']},
  professional:{name:'Professional reference report',people:1,parts:[],sections:[]}
};
const DAY=86400000;
const iso=time=>new Date(time).toISOString().slice(0,10);
const stamp=value=>Date.parse(`${value}T00:00:00Z`);
const text=(value,max,label)=>{if(typeof value!=='string'||value.length>max)throw Error(`Invalid ${label}.`);return value;};

export function readDraft(value){
  if(value?.version===1){const old=readLegacy(value);return {format:old.format,version:2,offer:'professional',readingDate:old.readingDate,people:[{name:old.name,birthdate:old.birthdate,relation:'Buyer'}],sections:['','','',''],notes:old.notes,includeNotes:old.includeNotes,reviewed:false};}
  if(!value||value.format!=='card-blueprints-report'||value.version!==2||!OFFERS[value.offer])throw Error('Choose a supported Card Blueprints report draft.');
  if(!Array.isArray(value.people)||value.people.length!==OFFERS[value.offer].people)throw Error('This offer has a different number of people.');
  const people=value.people.map(person=>({name:text(person?.name,60,'person name'),birthdate:text(person?.birthdate,10,'birth date'),relation:text(person?.relation,60,'relationship')}));
  if(!Array.isArray(value.sections)||value.sections.length!==4)throw Error('Invalid writing sections.');
  if(typeof value.includeNotes!=='boolean'||typeof value.reviewed!=='boolean')throw Error('Invalid report settings.');
  return {format:value.format,version:2,offer:value.offer,readingDate:text(value.readingDate,10,'reading date'),people,sections:value.sections.map(section=>text(section,6000,'section writing')),notes:text(value.notes,12000,'reader notes'),includeNotes:value.includeNotes,reviewed:value.reviewed};
}
export const createDraft=fields=>readDraft({format:'card-blueprints-report',version:2,...fields});
export const fileStem=draft=>legacyStem({name:draft.people[0].name,readingDate:draft.readingDate}).replace('card-blueprints-',`my-card-blueprint-${draft.offer}-`);

function horizonEnd(date){
  const [year,month,day]=date.split('-').map(Number);
  const end=new Date(Date.UTC(year+1,month-1,day));
  if(end.getUTCMonth()!==month-1)end.setUTCDate(0);
  return iso(end.getTime()-DAY);
}
function snapshot(person,index,start,end){
  if(!person.name.trim()||!person.relation.trim())throw Error('Enter each person’s name and relationship to the buyer.');
  const first=buildProfessionalReading(person.name.trim(),person.birthdate,start);
  const cycles=[];
  let cycle=first;
  for(let count=0;count<3;count++){
    const periods=cycle.periods.map((period,i)=>({...period,cards:cycle.anchors.map(anchor=>({anchor:anchor.id,card:anchor.walk[i]}))}));
    cycles.push({age:cycle.age,start:periods[0].start,end:periods[6].end,indexes:cycle.indexes,projection:cycle.projection,
      anchors:cycle.anchors.map(anchor=>({...anchor,longRangeCard:anchor.longRange.cards[cycle.slot]})),periods});
    const next=iso(stamp(periods[6].end)+DAY);if(next>end)break;
    cycle=buildProfessionalReading(person.name.trim(),person.birthdate,next);
  }
  const windows=cycles.flatMap(c=>c.periods.filter(p=>p.end>=start&&p.start<=end).map(p=>({...p,cycleAge:c.age,fullStart:p.start,fullEnd:p.end,start:p.start<start?start:p.start,end:p.end>end?end:p.end})));
  const identity=first.anchors.map(anchor=>({role:anchor.id,card:anchor.card,description:descriptions[anchor.card]||null,meaning:meanings[anchor.card]||null}));
  return {id:`person-${index+1}`,...person,name:person.name.trim(),identity,cycles,windows};
}
export function buildEngineData(draft){
  const end=horizonEnd(draft.readingDate);
  const people=draft.people.map((person,index)=>snapshot(person,index,draft.readingDate,end));
  const identityLinks=[],appearances=[],overlaps=[];
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const a=people[i],b=people[j];
    for(const x of a.identity)for(const y of b.identity)if(x.card===y.card)identityLinks.push({a:a.id,aRole:x.role,b:b.id,bRole:y.role,card:x.card});
    for(const x of a.windows)for(const y of b.windows){
      if(x.cards[0].card!==y.cards[0].card)continue;
      const start=x.start>y.start?x.start:y.start,end=x.end<y.end?x.end:y.end;
      if(start<=end)overlaps.push({a:a.id,b:b.id,aPlanet:x.planet,bPlanet:y.planet,card:x.cards[0].card,start,end});
    }
  }
  for(const source of people)for(const target of people){
    if(source===target)continue;
    for(const identity of source.identity)for(const cycle of target.cycles)for(const anchor of cycle.anchors){
      const positions=[...anchor.walk.map((card,i)=>({card,role:['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Result'][i],start:i<7?cycle.periods[i].start:cycle.start,end:i<7?cycle.periods[i].end:cycle.end})),
        {card:anchor.longRangeCard,role:'Long Range',start:cycle.start,end:cycle.end},
        ...(!anchor.annual?[]:[{card:anchor.annual.environment,role:'Environment',start:cycle.start,end:cycle.end},{card:anchor.annual.displacement,role:'Displacement',start:cycle.start,end:cycle.end}])];
      for(const p of positions)if(identity.card===p.card&&p.end>=draft.readingDate&&p.start<=end)appearances.push({source:source.id,sourceRole:identity.role,target:target.id,targetAnchor:anchor.id,role:p.role,card:p.card,start:p.start<draft.readingDate?draft.readingDate:p.start,end:p.end>end?end:p.end});
    }
  }
  const codes=new Set(people.flatMap(person=>person.cycles.flatMap(cycle=>cycle.anchors.flatMap(anchor=>[anchor.card,...anchor.walk,...anchor.longRange.cards,...(anchor.annual?[anchor.annual.environment,anchor.annual.displacement]:[])]))));
  return {schema:'my-card-blueprint-engine/v1',offer:draft.offer,readingDate:draft.readingDate,window:{start:draft.readingDate,end},people,identityLinks,appearances,overlaps,meanings:Object.fromEntries([...codes].map(card=>[card,meanings[card]||null])),method:{periods:'Six 52-day periods; Neptune continues to the eve of the next birthday. February 29 anniversaries use February 28 in non-leap years.',connections:'Exact identity-to-position matches and intersecting identical birth-anchor period cards. No relationship score or outcome is inferred.',source:'Existing lib/engine-core through scripts/professional-reading/builder.ts; card-meanings.json; card-descriptions.json'}};
}
export function buildDocument(fields){
  const draft=createDraft(fields);
  if(draft.offer==='professional'){
    const old=buildLegacy({name:draft.people[0].name,birthdate:draft.people[0].birthdate,readingDate:draft.readingDate,notes:draft.notes,includeNotes:draft.includeNotes});
    return {...old,draft,engine:null};
  }
  const engine=buildEngineData(draft);
  return {draft,engine,html:renderOfferReport(draft,engine,OFFERS[draft.offer])};
}
