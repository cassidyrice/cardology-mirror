import {calculate} from './engine.mjs';
import meanings from '../../lib/card-meanings.json';
const $=id=>document.getElementById(id);
const views=[['annual','Annual spread','▣'],['life','Life spread','∞'],['spirit','Spirit spread','♧'],['septennial','Seven-year cycle','▥'],['weekly','Weekly spread','▦'],['board','Full board','⊞']];
let result=null,view='annual',anchor=null,boardIndex=0;
const today=new Date();
$('target').value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function card(code,caption){const b=node('button',undefined,'card'+(/[♥♦]/.test(code)?' red':'')+(code===anchor?' anchor':''));b.type='button';b.setAttribute('aria-label',`${caption}: ${code??'No card'}`);b.append(node('span',code?code.slice(0,-1):'—'),node('span',code?code.slice(-1):'', 'suit'));b.onclick=()=>showDetail(code,caption);return b;}
function showDetail(code,caption){const area=$('detail-content');area.replaceChildren(node('p',caption),node('h3',code??'No card assigned'));const meaning=meanings[code];if(meaning){area.append(node('strong',meaning.name));for(const [key,label] of [['under','Under-expression'],['sweet_spot','Sweet spot'],['over','Over-expression']])area.append(node('p',`${label}: ${meaning[key]}`));}else area.append(node('p','This position has no card assigned by the engine. Fixed cards have no Environment or Displacement pair.'));$('detail').showModal();}
$('close-detail').onclick=()=>$('detail').close();
function position(label,code,current=false,extra=''){const e=node('div',undefined,'position'+(current?' current':''));e.append(node('label',label),card(code,label),node('small',extra||(current?'Active':'')));return e;}
const nav=document.querySelector('nav');
for(const [key,label,icon]of views){const b=node('button');b.setAttribute('aria-label',label);const glyph=node('span',icon);glyph.setAttribute('aria-hidden','true');b.append(glyph,document.createTextNode(label));b.dataset.view=key;b.onclick=()=>{view=key;render();};nav.append(b);}
function summary(){const ar=result.blueprint.archetype;const area=$('summary');area.replaceChildren();for(const [label,code]of [['Birth card',ar.birth_card],['Planetary ruling card',ar.prc]]){const e=node('section',undefined,'summary');const identity=node('div',undefined,'identity');const text=node('div');const meaning=meanings[code];text.append(node('strong',meaning?.name??code),node('p',`${result.birthday} · Age ${result.blueprint.timing.age}`));if(label==='Planetary ruling card'&&ar.prc_secondary)text.append(node('p',`Secondary ruling card: ${ar.prc_secondary}`));identity.append(card(code,label),text);e.append(node('h3',label),identity);area.append(e);}}
function renderBoard(index){const panel=node('section',undefined,'board-panel');panel.append(node('h3',`Full 7×7 board · ${index}`));const board=result.boards[index];const crown=node('div',undefined,'crown');board.crown.forEach((c,i)=>crown.append(position(`Crown ${i+1}`,c)));panel.append(crown);const grid=node('div',undefined,'board');grid.append(node('span'));for(let c=0;c<7;c++)grid.append(node('span',result.planets[6-c],'axis'));board.grid.forEach((row,r)=>{grid.append(node('span',String(r+1),'axis'));row.forEach((c,col)=>grid.append(card(c,`Row ${r+1}, ${result.planets[6-col]} (column ${col+1})`)));});panel.append(grid,node('p','All 52 seats. Planetary columns read right to left. Your selected anchor is outlined in teal.','note'));return panel;}
function render(){
  document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
  $('title').textContent=views.find(v=>v[0]===view)[1];
  if(!result)return;
  $('subtitle').textContent=`${result.birthday} → ${result.targetDate} · Age ${result.blueprint.timing.age} · Annual board ${result.spreads[anchor].annual.index}`;
  summary();$('anchors').replaceChildren();
  Object.keys(result.spreads).forEach((a,i)=>{const b=node('button',`${['Birth card','Ruling card','Secondary ruling card'][i]} · ${a}`,a===anchor?'active':'');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(a===anchor));b.onclick=()=>{anchor=a;render();};$('anchors').append(b);});
  const content=$('content');content.replaceChildren();
  if(view==='board'){
    const controls=node('div',undefined,'board-control');const select=node('select');select.setAttribute('aria-label','Board number');for(let i=0;i<90;i++){const o=node('option',`Board ${i}${i===0?' · Life':i===1?' · Spirit':''}`);o.value=i;select.append(o);}select.value=boardIndex;select.onchange=()=>{boardIndex=Number(select.value);render();};controls.append(node('label','Choose a board'),select);content.append(controls);const b=renderBoard(boardIndex);b.className='full-board';content.append(b);return;
  }
  const spread=result.spreads[anchor][view];const index=spread.index??spread.spread_used;
  const layout=node('div',undefined,'workspace'),left=node('section');
  left.append(node('h3',view==='weekly'?'Daily positions for this week':view==='septennial'?'Seven years in this cycle':'Planetary spread'));
  const positions=node('div',undefined,'positions');
  if(view==='weekly')spread.days.forEach(d=>positions.append(position(d.weekday,d.card,d.weekday===spread.current_weekday)));
  else if(view==='septennial')spread.years.forEach(y=>positions.append(position(`Year ${y.year_in_cycle}`,y.card,y.year_in_cycle===spread.current_year_in_cycle,`Age ${y.age_at_start}`)));
  else result.planets.forEach(p=>positions.append(position(p,spread.positions[p],view==='annual'&&p===result.blueprint.active_period.planet)));
  left.append(positions);
  if(spread.positions){left.append(node('h3','Additional positions','section-title'));const extras=node('div',undefined,'extra');const long=result.spreads[anchor].septennial.current_card;for(const [p,c]of [['Pluto',spread.positions.Pluto],['Result',spread.positions.Result],['Environment',spread.karma?.environment],['Displacement',spread.karma?.displacement],['Long range',view==='annual'?long:null]])extras.append(position(p,c));left.append(extras);}
  if(view==='annual'){const daily=result.spreads[anchor].daily;left.append(node('h3',`Personal daily · ${daily.period} sub-periods`,'section-title'));const row=node('div',undefined,'positions');result.planets.forEach((p,i)=>row.append(position(p,daily.cards?.[i],i===daily.subIndex)));left.append(row);}
  const guide=node('div',undefined,'guide');guide.append(node('h3','Position guide'),node('p',`Click any card for its stored interpretation. ${view==='annual'?'Annual positions use the engine’s age + 1 board.':view==='life'?'Life board = 0.':view==='spirit'?'Spirit board = 1.':`Cycle board = ${index}.`}`));const karma=result.spreads[anchor].lifetimeKarma;guide.append(node('p',`Lifetime Gift: ${karma?.environment??'None (fixed card)'} · Lifetime Challenge: ${karma?.displacement??'None (fixed card)'}`));left.append(guide);layout.append(left,renderBoard(index));content.append(layout);
}
$('birth-form').onsubmit=event=>{event.preventDefault();try{const next=calculate($('birthday').value,$('target').value);result=next;anchor=result.blueprint.archetype.birth_card;boardIndex=result.spreads[anchor].annual.index;$('error').textContent='';$('status').textContent='Calculated locally. Birthdays are not saved.';$('export').disabled=false;$('print').disabled=false;render();}catch(e){result=null;anchor=null;$('summary').replaceChildren();$('anchors').replaceChildren();$('content').replaceChildren(node('p','Update the date inputs to calculate a spread.'));$('error').textContent=e.message;$('status').textContent='';$('export').disabled=true;$('print').disabled=true;}};
$('export').onclick=async()=>{if(!result)return;try{const json=JSON.stringify(result,null,2);if(window.desktop){const saved=await window.desktop.save(json);$('status').textContent=saved?'JSON exported.':'Export canceled.';}else{const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=node('a');a.href=url;a.download=`card-blueprints-${result.birthday}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='JSON exported.';}}catch(e){$('status').textContent=`Export failed: ${e.message}`;}};
$('print').onclick=()=>window.desktop?window.desktop.print():window.print();
render();
const reportLink=node('a','Report builder');
reportLink.href='report.html';reportLink.className='report-link';nav.append(reportLink);
