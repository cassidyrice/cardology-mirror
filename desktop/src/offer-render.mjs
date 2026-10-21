// Renders a Chemistry Check, Timing Map, Family Snapshot, or Birth Card Blueprint as one standalone HTML document.
// Every card, date, and card meaning comes from the engine data; the copy here only frames it.
import {cardFace} from './card-faces.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const red=code=>/[♥♦]/.test(code||'');
const card=code=>code?`<span class="card-code">${escape(code.slice(0,-1))}<span class="${red(code)?'suit-red':'suit-ink'}">${escape(code.slice(-1))}</span></span>`:'<span class="card-code">None</span>';
const faceClass=code=>code==='Joker'?'f-joker':`f-${code.slice(0,-1)}${'shdc'['♠♥♦♣'.indexOf(code.slice(-1))]}`;
let usedFaces=new Set();
const tile=(code,size='')=>{
  if(!code)return card(code);
  if(cardFace(code)){usedFaces.add(code);return `<span class="tile face ${faceClass(code)} ${size}" role="img" aria-label="${escape(code)}"></span>`;}
  const rank=escape(code.slice(0,-1)),suit=escape(code.slice(-1));
  return `<span class="tile ${size}${red(code)?' red':''}" aria-label="${escape(code)}"><i>${rank}<br>${suit}</i><b>${suit}</b><i class="flip">${rank}<br>${suit}</i></span>`;
};
const role=code=>code==='BC'?'birth card':code==='PRC1'?'ruling card':`ruling card ${code.slice(3)}`;
// Reuse the fixed UTC formatters across report dates and requests.
const dateFormat=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const shortFormat=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
const date=value=>dateFormat.format(new Date(`${value}T12:00:00Z`));
const short=value=>shortFormat.format(new Date(`${value}T12:00:00Z`));
const range=item=>`${date(item.start)} – ${date(item.end)}`;
const days=(a,b)=>Math.round((Date.parse(`${b}T00:00:00Z`)-Date.parse(`${a}T00:00:00Z`))/86400000)+1;
const chunks=(items,size)=>Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
const SUITS=['♠','♥','♦','♣'];
const FOOTER='Cards are coordinates. You choose the meaning.';
// Brand lockup, geometry copied from scripts/professional-reading/render.ts: the Life Spread drawn empty, one seat lit.
const BRAND=`<div class="brand"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke-width="1.1">${[2,12,22].map(y=>[3.5,12.5,21.5].map(x=>{const lit=x===12.5&&y===12;return `<rect x="${x}" y="${y}" width="7" height="8" rx="1" stroke="${lit?'var(--gold)':'currentColor'}" stroke-opacity="${lit?1:0.45}"/>`;}).join('')).join('')}</g></svg><span class="brand-word">card blueprint</span></div>`;

// What each position does, in one line. Planet theme words match the engine's PLANET_WORDS.
const POSITION={
  Mercury:['Mind','Messages, ideas, fast decisions. Things move quickly and leave quickly.'],
  Venus:['Relationships','What and whom you are drawn to. Affection, pleasure, ease.'],
  Mars:['Action','Drive, friction, competition. Energy that needs somewhere to go.'],
  Jupiter:['Growth','Whatever this card touches gets bigger. Choose carefully what you feed.'],
  Saturn:['Limits','The lesson with no shortcut. Hard now, useful later.'],
  Uranus:['Disruption','The unplanned turn. Independence, change, surprise.'],
  Neptune:['Dissolution','Dreams, distance, blurred edges. Hard to see clearly, easy to romanticise.'],
  Pluto:['The challenge','The thing this year is pushing you to become.'],
  Result:['The payoff','Where the challenge lands if you do the work.'],
  'Long Range':['The headline','The tone of the whole birthday year.'],
  Environment:['The gift','What the year hands you. A card working in your favour.'],
  Displacement:['The debt','What the year asks of you. Where you give more than you get.']
};
const PLANET_COLOR={Mercury:'#8fb3c9',Venus:'#e3a891',Mars:'#c97a66',Jupiter:'#d9b968',Saturn:'#8d8fae',Uranus:'#76b8ad',Neptune:'#9d8cc4'};
const SEASON_QUESTION={
  Mercury:'What would you say this season if you stopped editing yourself first?',
  Venus:'Who do you keep choosing, and is it still a choice?',
  Mars:'Which fight is worth having, and which one is just habit?',
  Jupiter:'If this doubled in size, would you still want it?',
  Saturn:'What are you avoiding that would get easier the moment you stopped?',
  Uranus:'What would you change if nobody needed an explanation?',
  Neptune:'What are you calling intuition that might just be hope?'
};
const COPY={
  chemistry:{hook:'Two people. One deck. Here is what is actually going on.',parts:[
    {glyph:'♥',line:'Before timing, wiring. What each of you runs on when nobody is performing.',asks:['What does each of you bring by default?','Where do your best selves meet?','Where do your worst habits collide?']},
    {glyph:'♦',line:'Chemistry is not fixed. Here is what this year is doing to it.',asks:['What is each of you going through right now?','When do you land in each other’s year?','Which dates deserve a calendar alert?']}]},
  'timing-map':{hook:'Your year, mapped. What it asks of you, and who walks into it.',parts:[
    {glyph:'♠',line:'Before anyone else shows up, there is you. Your build, your year, your seven seasons.',asks:['What are you built to do?','What is this birthday year really about?','When does each season start, and what is it for?']},
    {glyph:'♣',line:'Nobody’s year is a solo act. Here is who walks into yours, and when.',asks:['Who is built like you, and who is built against you?','Where do they land in your calendar?','Which dates are worth planning around?']}]},
  'individual-timing':{hook:'Your core cards, yearly themes, and dated seasons across the next twelve months.',parts:[
    {glyph:'♠',line:'Start with your core cards, then follow the themes and dated seasons of the year ahead.',asks:['What patterns do you return to?','Which themes frame your birthday year?','When does each season begin and end?']},
    {glyph:'♣',line:'Reflect on the season you are in, then choose what you want to carry into the year ahead.',asks:['What deserves your attention now?','Which habits help you use this season well?','What will you revisit as the year unfolds?']}]},
  'birth-card-blueprint':{hook:'Your birth card, your ruling card, and how the two work together.',parts:[
    {glyph:'♠',line:'One card for the day you were born. Here is what it means, what it gives you, and where it trips you up.',asks:['What does your birth card mean?','What are you built to do well?','Where does it work against you?']},
    {glyph:'♥',line:'The same card in love, at work, and in the colours of your ruling card.',asks:['How does it show up in love?','How does it show up at work?','How does your ruling card colour it?']}]},
  family:{hook:'Same house. Different cards. Here is how everyone is built.',parts:[
    {glyph:'♣',line:'Every family runs on a system. Nobody wrote it down. Until now.',asks:['How is each person built?','Where does the family move as one?','Where does it crack?']},
    {glyph:'♦',line:'Where everyone is this year, and where they land in yours.',asks:['What is each person going through right now?','Who shows up in your year, and as what?','Which pattern is ready to stop with you?']}]}
};

export function renderOfferReport(draft,engine,offer,variant='default'){
  const individual=variant==='individual-timing',blueprint=variant==='birth-card-blueprint';
  if(variant!=='default'&&!individual&&!blueprint)throw Error('Unsupported report presentation.');
  if(blueprint&&(draft.offer!=='birth-card-blueprint'||draft.version!==3||draft.people.length!==1||engine.offer!=='birth-card-blueprint'))throw Error('Birth Card Blueprint requires a version 3 draft and exactly one person.');
  if(individual&&(draft.offer!=='timing-map'||draft.version!==3||draft.people.length!==1||engine.offer!=='timing-map'||engine.people.length!==1))throw Error('Individual Timing requires a version 3 draft and exactly one person.');
  usedFaces=new Set();
  const pages=[],toc=[],people=blueprint?[]:engine.people,buyer=blueprint?{name:draft.people[0].name.trim()}:people[0],copy=COPY[individual?'individual-timing':draft.offer];
  const person=id=>people.find(p=>p.id===id);
  const firsts=people.map(p=>p.name.split(/\s+/)[0]);
  const nameOf=p=>{const i=people.indexOf(p);return firsts.filter(n=>n===firsts[i]).length>1?p.name:firsts[i];};
  // Long display names need room in both labels and repeated person/connection rows.
  const longLabels=people.some(p=>nameOf(p).length>24);
  const compactCover=people.some(p=>p.name.length>40||p.relation.length>40);
  const who=p=>p===buyer?'You':escape(nameOf(p));
  const whose=p=>p===buyer?'your':`${escape(nameOf(p))}’s`;
  const cap=text=>text.charAt(0).toUpperCase()+text.slice(1);
  const meaning=(code,key='sweet_spot')=>escape(engine.meanings[code]?.[key]||'No sourced meaning is available for this card.');
  const ask=text=>`<div class="reflection"><b>YOURS</b> · ${escape(text)}<div class="writing-line"></div></div>`;
  const tocList=()=>`<ol class="toc">${toc.map(item=>`<li class="${/^Part/.test(item.label)?'part':''}"><span>${escape(item.label)}</span><i></i><b>${String(item.number).padStart(2,'0')}</b></li>`).join('')}</ol>`;
  const page=(title,body,extra='')=>{pages.push({title,body,extra});return pages.length;};
  const mark=(label,number=pages.length+1)=>toc.push({label,number});
  const writing=(title,text,glyph='✦')=>{
    if(!text.trim())return;
    const lines=[];
    for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
      let rest=paragraph;
      while(rest.length>36){let end=rest.lastIndexOf(' ',36);if(end<12)end=36;lines.push(rest.slice(0,end));rest=rest.slice(end).trimStart();}lines.push(rest);
    }
    for(const [i,linesOnPage] of chunks(lines,25).entries())page(`${title}${i?' / continued':''}`,`<div class="letter"><div class="margin"><b>${glyph}</b><span>From your reader</span>${i?'<small>continued</small>':''}</div><div class="personal-copy">${linesOnPage.map(line=>`<div>${escape(line)||'&nbsp;'}</div>`).join('')}</div></div>`,'writing');
  };
  const section=index=>writing(offer.sections[index],draft.sections[index],SUITS[index]);
  const kicker=(index,text=offer.sections[index])=>`<p class="eyebrow kicker"><b>${SUITS[index]}</b> ${escape(text)}</p>`;
  const opener=index=>{
    const part=copy.parts[index];mark(`Part ${index?'II':'I'} · ${offer.parts[index]}`);
    page(`Part ${index?'II':'I'} · ${offer.parts[index]}`,`<div class="opener-glyph${part.glyph==='♥'||part.glyph==='♦'?' red':''}">${part.glyph}</div><p class="eyebrow numeral">Part ${index?'II':'I'}</p><p class="display">${escape(offer.parts[index])}</p><p class="lead">${escape(part.line)}</p><div class="divider">✦</div><p class="eyebrow">This part answers</p><ol class="asks">${part.asks.map(q=>`<li>${escape(q)}</li>`).join('')}</ol>`,'opener');
  };

  // Identity dossier: the card, its best version, and both ways it goes wrong.
  const dossier=(p,index)=>{
    const id=p.identity[0],d=id.description||{},m=id.meaning||{};
    const gifts=(d.gifts||'').split('\n').map(line=>line.replace(/^[-•]\s*/,'').trim()).filter(Boolean).slice(0,4);
    page(p===buyer?'You, by the cards':`${nameOf(p)}, by the cards`,`${kicker(index)}<div class="dossier-head"><div class="tiles">${p.identity.map(item=>`<figure>${tile(item.card,item===id?'lg':'')}<figcaption>${escape(role(item.role))}</figcaption></figure>`).join('')}</div><div><p class="meta">${escape(p.relation)} · Born ${date(p.birthdate)}</p><h3 class="archetype">${escape(d.title||id.card)}</h3><p>${escape(d.core_identity||'No sourced identity description available.')}</p></div></div>
      <p class="eyebrow">The dial</p><div class="dial"><div><small>Under stress</small><p>${escape(m.under||'No sourced meaning available.')}</p></div><div class="best"><small>At ${p===buyer?'your':'their'} best</small><p>${escape(m.sweet_spot||'No sourced meaning available.')}</p></div><div><small>Pushed too far</small><p>${escape(m.over||'No sourced meaning available.')}</p></div></div>
      <div class="two">${gifts.length?`<div><p class="eyebrow">Built-in gifts</p><ul class="gifts">${gifts.map(g=>`<li>${escape(g)}</li>`).join('')}</ul></div>`:''}${d.shadow?`<div><p class="eyebrow">The shadow</p><p>${escape(d.shadow)}</p></div>`:''}</div>
      ${p===buyer?ask('Which end of the dial did the people closest to you get this past month?'):''}`);
  };

  // Click and clash: the same sourced fork, laid side by side so the reader does the comparing.
  const sideBySide=index=>{
    mark(offer.sections[index]);
    const groups=chunks(people,longLabels?3:4);
    for(const [i,group] of groups.entries())page(i?'Where you click / continued':'Where you click',`${kicker(index)}<p class="lead">Put everyone’s best version in one room. This is what it sounds like.</p><div class="rows">${group.map(p=>`<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)}</h3><p>${meaning(p.identity[0].card)}</p></div></div>`).join('')}</div>${i===groups.length-1?ask('Which of these lines describes something the others secretly rely on?'):''}`);
    for(const [i,group] of groups.entries())page(i?'Where you clash / continued':'Where you clash',`${kicker(index)}<p class="lead">Now the low roads. Clashes rarely start with the big stuff. They start where one person’s stress meets another person’s excess.</p><div class="rows">${group.map(p=>`<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)}</h3><p><b>Under stress.</b> ${meaning(p.identity[0].card,'under')}</p><p><b>Pushed too far.</b> ${meaning(p.identity[0].card,'over')}</p></div></div>`).join('')}</div>${i===groups.length-1?ask(people.length>2?'Whose low road does the whole house quietly organise itself around?':'When you two clash, whose low road shows up first?'):''}`);
    const links=chunks(engine.identityLinks,longLabels?2:4);
    if(!links.length)links.push([]);
    for(const [i,group] of links.entries())page(i?'Shared cards / continued':'Shared cards',`${kicker(index)}${i?'':'<p class="lead">Exact matches between your core cards. Rare, and worth noticing when they happen.</p>'}${group.length?`<div class="rows">${group.map(link=>`<div class="row">${tile(link.card,'sm')}<div><h3>${who(person(link.a))} &amp; ${escape(person(link.b)===buyer?'you':nameOf(person(link.b)))}</h3><p class="meta">${cap(whose(person(link.a)))} ${escape(role(link.aRole))} is ${whose(person(link.b))} ${escape(role(link.bRole))}</p><p>${meaning(link.card)}</p></div></div>`).join('')}</div>`:`<div class="verdict"><b>No shared cards.</b><p>Nobody here holds anyone else’s birth or ruling card. You are built from different material. Neither good nor bad, it just means the connection has to be made on purpose. The dated crossings later in this reading show where it happens on its own.</p></div>`}`);
  };

  // One page that shows the whole year: one band per person, segments sized by days.
  const timeline=index=>{
    const total=days(engine.window.start,engine.window.end);
    const months=[];for(let d=new Date(`${engine.window.start}T12:00:00Z`);months.length<12;d.setUTCMonth(d.getUTCMonth()+1,1))months.push(new Date(d));
    const pct=value=>(days(engine.window.start,value)-1)/total*100;
    page('The year on one page',`${kicker(index)}<p class="lead">Twelve months, ${people.length>1?'one band per person':`${buyer.windows.length} dated seasons`}. Each colour is a season. Each card is what that season is about.${individual?' Short bands are labelled in the dated season pages.':''}</p>
      <div class="timeline${longLabels?' long-labels':''}"><div class="months">${months.map(m=>({left:pct(m.toISOString().slice(0,10)),label:m.toLocaleString('en-US',{month:'short',timeZone:'UTC'})})).filter((m,i,all)=>!all[i+1]||all[i+1].left-m.left>5).map(m=>`<span style="left:${m.left.toFixed(2)}%">${m.label}</span>`).join('')}</div>
      ${people.map(p=>`<div class="lane"><p>${who(p)} <small>${escape(p.identity[0].card)}</small></p><div class="band">${p.windows.map(w=>`<span class="${days(w.start,w.end)/total<0.07?'narrow':''}" style="width:${(days(w.start,w.end)/total*100).toFixed(2)}%;background:${PLANET_COLOR[w.planet]}" title="${escape(w.planet)} ${escape(w.cards[0].card)}">${individual&&days(w.start,w.end)/total<0.07?'':`<b>${escape(w.cards[0].card)}</b><i>${escape(w.planet.slice(0,3))}</i>`}</span>`).join('')}</div></div>`).join('')}
      <div class="today">Today · ${short(engine.window.start)}</div></div>
      <div class="legend">${Object.entries(PLANET_COLOR).map(([planet,color])=>`<span><i style="background:${color}"></i>${planet} <small>${POSITION[planet][0]}</small></span>`).join('')}</div>
      ${ask(people.length>1?'Find the stretch where everyone changes season within a few weeks of each other. What usually happens in your life when that many things shift at once?':'Twelve months from now, what will you wish you had started today?')}`);
  };

  const season=(w,n)=>`<article class="season"><div class="season-no" style="color:${PLANET_COLOR[w.planet]}">${String(n).padStart(2,'0')}</div><div><h3>${escape(w.planet)} <small>${escape(POSITION[w.planet][0])}</small></h3><p class="meta">${range(w)} · ${days(w.start,w.end)} days${w.start!==w.fullStart||w.end!==w.fullEnd?` · full season ${short(w.fullStart)} – ${short(w.fullEnd)}`:''}</p><p><b>Best use.</b> ${meaning(w.cards[0].card)}</p><p><b>Watch for.</b> ${meaning(w.cards[0].card,'under')}</p><p class="q">${escape(SEASON_QUESTION[w.planet])}</p></div>${tile(w.cards[0].card)}</article>`;

  const rightNow=index=>{
    for(const [i,group] of chunks(people,longLabels?3:4).entries())page(i?'Right now / continued':'Right now',`${kicker(index)}${i?'':`<p class="lead">As of ${date(engine.readingDate)}. ${individual?'This is the season you are in today.':'This is the season each of you is standing in today.'}</p>`}${group.map(p=>{const w=p.windows.find(item=>item.start<=engine.readingDate&&item.end>=engine.readingDate);return `<article class="now${people.length>3?' compact':''}">${tile(w.cards[0].card,people.length>3?'':'lg')}<div><h3>${who(p)} <small>· ${escape(w.planet)}, ${escape(POSITION[w.planet][0])}</small></h3><p class="meta">Started ${date(w.fullStart)} · ${days(engine.readingDate,w.fullEnd)} days left</p><p><b>Best use.</b> ${meaning(w.cards[0].card)}</p><p><b>Watch for.</b> ${meaning(w.cards[0].card,'under')}</p></div></article>`;}).join('')}${i===0?ask(individual?'What would using this season well look like in your ordinary week?':'Read these together. Is anyone in a season that makes the others harder to live with right now?'):''}`);
  };

  const yearly=index=>{
    for(const cycle of buyer.cycles){
      const anchor=cycle.anchors[0];
      const cell=(label,code)=>`<article class="cell"><p class="eyebrow">${escape(POSITION[label][0])} · ${escape(label)}</p>${tile(code,'sm')}<p class="gloss">${escape(POSITION[label][1])}</p><p>${code?meaning(code):'Fixed card: no annual Environment or Displacement pair is assigned.'}</p></article>`;
      page(`Your year at ${cycle.age}`,`${kicker(index)}<p class="meta">Birthday year ${range(cycle)}${cycle.projection?' · canonical 90-board projection':''}</p><div class="headline">${tile(anchor.longRangeCard,'lg')}<div><p class="eyebrow">The headline · Long Range</p><p class="big">${meaning(anchor.longRangeCard)}</p><p class="gloss">${escape(POSITION['Long Range'][1])}</p></div></div><div class="grid">${cell('Pluto',anchor.walk[7])}${cell('Result',anchor.walk[8])}${cell('Environment',anchor.annual?.environment)}${cell('Displacement',anchor.annual?.displacement)}</div>${cycle===buyer.cycles[0]?ask('If the headline above were the only thing people remembered about your year, would you be proud of it?'):''}`);
    }
  };

  const crossings=(index,title)=>{
    const connections=[...engine.appearances.map(item=>{
      const s=person(item.source),t=person(item.target);
      const line=t===buyer?`${escape(nameOf(s))} shows up in your year as your ${escape(item.role)} card.`:s===buyer?`You show up in ${escape(nameOf(t))}’s year as their ${escape(item.role)} card.`:`${escape(nameOf(s))} shows up in ${escape(nameOf(t))}’s year as their ${escape(item.role)} card.`;
      return {start:item.start,end:item.end,card:item.card,line,detail:`${cap(whose(s))} ${escape(role(item.sourceRole))} sits in ${whose(t)} ${escape(role(item.targetAnchor))} spread. ${escape(POSITION[item.role]?.[1]||'')}`,buyer:s===buyer||t===buyer};
    }),...engine.overlaps.map(item=>{
      const a=person(item.a),b=person(item.b);
      return {start:item.start,end:item.end,card:item.card,line:`${who(a)} and ${b===buyer?'you':escape(nameOf(b))} are on the same card at the same time.`,detail:`${who(a)} in ${escape(item.aPlanet)}, ${b===buyer?'you':escape(nameOf(b))} in ${escape(item.bPlanet)}. Same lesson, different rooms.`,buyer:a===buyer||b===buyer};
    })].sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
    const mine=connections.filter(c=>c.buyer),others=connections.filter(c=>!c.buyer);
    const groups=chunks(mine,longLabels?2:3);
    if(!groups.length&&!others.length)groups.push([]);
    const lead=`<p class="lead">${connections.length?`${connections.length} crossing${connections.length===1?'':'s'} in the next twelve months. ${mine.length?`${mine.length} of them run through you.`:'None of them run through you.'}`:'The calendar, checked for crossings.'}</p>`;
    for(const [i,group] of groups.entries())page(i?`${title} / continued`:title,`${title===offer.sections[index]?'':kicker(index)}${i?'':lead}${group.length?group.map(item=>`<article class="crossing mine"><div class="when"><b>${short(item.start)}</b><span>to ${short(item.end)}</span><small>${new Date(`${item.start}T12:00:00Z`).getUTCFullYear()}</small></div><div><h3>${item.line}</h3><p class="detail">${item.detail}</p><p>${meaning(item.card)}</p></div>${tile(item.card,'sm')}</article>`).join(''):`<div class="verdict"><b>A quiet year between you.</b><p>No exact identity-to-position matches or identical birth-anchor card overlaps fall inside this 12-month window. Nobody is written into anyone else’s year. Whatever happens, you will have chosen it.</p></div>`}${i===groups.length-1&&group.length?ask('Who is in your year by accident, and who is there on purpose?'):''}`);
    for(const [i,group] of chunks(others,longLabels?3:9).entries())page(`Meanwhile, between the others${i?' / continued':''}`,`${i||groups.length?'':lead}${i?'':'<p class="lead">You are not in these, but you will feel them. When two people around you are working the same card, the room changes.</p>'}<table class="ledger"><thead><tr><th>Dates</th><th>Who</th><th>Card</th></tr></thead><tbody>${group.map(item=>`<tr><td>${short(item.start)} – ${short(item.end)}<br><small>${new Date(`${item.start}T12:00:00Z`).getUTCFullYear()}</small></td><td>${item.line}<br><small>${item.detail}</small></td><td>${card(item.card)}</td></tr>`).join('')}</tbody></table>`);
  };

  const pattern=index=>{
    mark(offer.sections[index]);
    const groups=chunks(people,longLabels?3:4);
    for(const [i,group] of groups.entries())page(i?'The pattern, and the way out / continued':'The pattern, and the way out',`${kicker(index)}<p class="lead">Every card has a shadow it falls back on and a direction it is learning toward. Line them up and the family script shows.</p><div class="rows tight">${group.map(p=>{const d=p.identity[0].description||{};return `<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)} <small>· ${escape(d.title||p.identity[0].card)}</small></h3><p><b>The pattern.</b> ${escape(d.shadow||'No sourced shadow available.')}</p><p><b>The way out.</b> ${escape(d.life_direction||'No sourced direction available.')}</p></div></div>`;}).join('')}</div>${i===groups.length-1?ask('Which of these patterns did you inherit, and which one is ready to stop with you?'):''}`);
  };

  // Birth Card Blueprint chapters. No timing: every card line is a sourced field of the engine record.
  const bp=engine,bc=bp.birthCard;
  const RULING_LINE='Your birth card is your core, set by your birthday. Your planetary ruling card is a second card, tied to your astrological sign, that colours how the birth card expresses itself. Birth card is the engine; ruling card is the paint job everyone meets first.';
  const rulers=blueprint?bp.rulingCards:[],ownRulers=rulers.filter(r=>!r.sameAsBirthCard);
  const rulerLabel=r=>rulers.length>1?`Ruling card ${rulers.indexOf(r)+1}`:'Ruling card';
  const list=items=>`<ul class="gifts">${items.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>`;
  const blueprintCover=()=>{
    const cards=[{code:bc.code,name:bc.name,label:'Birth card'},...ownRulers.map(r=>({code:r.code,name:r.name,label:rulerLabel(r)}))];
    return `${BRAND}<h2>Your private reading</h2><p class="eyebrow">Private · Prepared for</p><p class="prepared">${escape(buyer.name)}</p><h1>${escape(offer.name)}</h1><p class="subtitle">${escape(copy.hook)}</p><dl class="facts"><dt>Reading date</dt><dd>${escape(draft.readingDate)}</dd><dt>Birthday</dt><dd>${escape(bp.birthday.label)}</dd><dt>Birth card</dt><dd>${escape(bc.name)}</dd><dt>Ruling card${rulers.length>1?'s':''}</dt><dd>${bp.joker?'None separate from the Joker':rulers.map(r=>escape(r.name)).join(' / ')}</dd></dl><div class="anchors cover-people" style="--people:${cards.length}">${cards.map(c=>`<div>${tile(c.code,'lg')}<h3>${escape(c.name)}</h3><p>${escape(c.label)}</p></div>`).join('')}</div><h3>How to read this document</h3><p><b>FIXED</b> is the reproducible calculation: every card here comes from your birthday alone. <b>PATTERN</b> is sourced interpretation: a possible tendency, never a verdict. <b>YOURS</b> is a question with space to answer it.</p>`;
  };
  const blueprintArea=(title,item,detailLabel,question)=>page(title,`${kicker(2)}<div class="headline">${tile(bc.code,'lg')}<div><p class="eyebrow">${escape(title)} · ${escape(bc.name)}</p><p class="big">${escape(item.text)}</p></div></div>${item.composed?`<p class="meta">${escape(item.note)}</p><p><b>Watch for.</b> ${escape(item.detail)}</p>`:item.detail?`<p class="eyebrow">${escape(detailLabel)}</p><p>${escape(item.detail)}</p>`:''}${ask(question)}`);
  const blueprintChapters=()=>{
    opener(0);mark(offer.sections[0]);
    page('Your birth card',`${kicker(0)}<div class="dossier-head"><div class="tiles"><figure>${tile(bc.code,'lg')}<figcaption>birth card</figcaption></figure>${ownRulers.map(r=>`<figure>${tile(r.code)}<figcaption>${escape(rulerLabel(r).toLowerCase())}</figcaption></figure>`).join('')}</div><div><p class="meta">Born ${escape(bp.birthday.label)} · Solar value ${bp.solarValue} · ${escape(bc.name)}</p><h3 class="archetype">${escape(bc.title||bc.name)}</h3><p>${escape(bc.coreIdentity)}</p></div></div>
      ${bc.reading?`<p class="eyebrow">The card in one paragraph</p><p class="lead">${escape(bc.reading)}</p>`:''}<div class="two">${bc.lifeDirection?`<div><p class="eyebrow">Life direction</p><p>${escape(bc.lifeDirection)}</p></div>`:''}<div><p class="eyebrow">Keywords</p>${list(bc.keywords)}</div></div>
      ${ask('Which of these lines would the people closest to you recognise first?')}`);
    section(0);
    mark(offer.sections[1]);
    page('Your strengths',`${kicker(1)}<div class="headline">${tile(bc.code,'lg')}<div><p class="eyebrow">At your best</p><p class="big">${escape(bc.sweetSpot)}</p>${bc.surfaceTruth?`<p class="gloss">In your own words: “${escape(bc.surfaceTruth)}”</p>`:''}</div></div>
      ${bc.gifts.length||bc.inTheLight?`<div class="two">${bc.gifts.length?`<div><p class="eyebrow">Built-in gifts</p>${list(bc.gifts)}</div>`:''}${bc.inTheLight?`<div><p class="eyebrow">In the light${bc.lightName?` · ${escape(bc.lightName)}`:''}</p><p>${escape(bc.inTheLight)}</p></div>`:''}</div>`:`<p class="meta">The card data lists no separate gifts for ${escape(bc.name)}; the line above is its strength.</p>`}
      ${ask('Where does this strength get used least in your life right now?')}`);
    page('Your shadow',`${kicker(1)}${bc.under?`<p class="eyebrow">The dial</p><div class="dial"><div><small>Under stress</small><p>${escape(bc.under)}</p></div><div class="best"><small>At your best</small><p>${escape(bc.sweetSpot)}</p></div><div><small>Pushed too far</small><p>${escape(bc.over)}</p></div></div>`:''}
      <div class="two"><div><p class="eyebrow">The shadow</p><p>${escape(bc.shadow)}</p></div><div><p class="eyebrow">What it costs</p><p>${escape(bc.cost)}</p></div></div>
      ${bc.archetype?`<p class="eyebrow">The shadow archetype</p><h3>${escape(bc.archetype)}</h3><p>${escape(bc.coreShadow)}</p>`:''}<div class="verdict"><b>Watch for</b><p>${escape(bc.watchFor)}</p></div>
      ${ask(bc.prompts[0]||'Which end of this card did the people closest to you get this past month?')}`);
    section(1);
    opener(1);mark(offer.sections[2]);
    blueprintArea('Love',bp.love,'What you need from a partner','Who gets the best version of this card from you, and who gets the shadow?');
    blueprintArea('Work',bp.work,'Where it fits','Which part of your work uses this card on purpose, and which part fights it?');
    section(2);
    mark(offer.sections[3]);
    const intro=`<p class="lead">${escape(RULING_LINE)}</p>${rulers.length>1?`<p>Your birthday lists ${rulers.length} ruling cards, in table order. Each one adds nuance to how the birth card shows up.</p>`:''}`;
    rulers.forEach((r,i)=>{
      const last=i===rulers.length-1,title=rulers.length>1?`Your ruling cards · ${i+1} of ${rulers.length}`:'Your ruling card';
      if(r.sameAsBirthCard){
        page(title,`${kicker(3)}${i?'':intro}<div class="headline">${tile(r.code,'lg')}<div><p class="eyebrow">${escape(rulerLabel(r))} · ${escape(r.name)}</p><p class="big">${bp.joker?'The Joker has no separate ruling card.':'Your ruling card is your birth card.'}</p></div></div><div class="verdict"><b>${bp.joker?'Read from the Joker alone':'One card, twice'}</b><p>${bp.joker?'The ruling-card table lists the Joker itself for December 31. The 52-card material is built on solar values 1 through 52 and does not resolve for zero, so no other card colours yours.':`The ruling-card table lists ${escape(r.name)} for your birthday, the same card as your birth card. The way you come across is the way you are built.`}</p></div>${last?ask('Where do you get read correctly on first meeting, and where does that surprise people?'):''}`);
        return;
      }
      page(title,`${kicker(3)}${i?'':intro}<div class="dossier-head"><div class="tiles"><figure>${tile(r.code,'lg')}<figcaption>${escape(rulerLabel(r).toLowerCase())}</figcaption></figure><figure>${tile(bc.code,'sm')}<figcaption>birth card</figcaption></figure></div><div><p class="meta">${escape(r.name)}</p><h3 class="archetype">${escape(r.title||r.name)}</h3><p>${escape(r.coreIdentity)}</p></div></div>
        <p class="eyebrow">How it colours your birth card</p><div class="rows"><div class="row">${tile(bc.code,'sm')}<div><h3>The engine <small>· birth card, ${escape(bc.name)}</small></h3><p>${escape(bc.sweetSpot)}</p><p><b>Watch for.</b> ${escape(bc.watchFor)}</p></div></div><div class="row">${tile(r.code,'sm')}<div><h3>The paint job <small>· ${escape(rulerLabel(r).toLowerCase())}, ${escape(r.name)}</small></h3><p>${escape(r.sweetSpot)}</p><p><b>Watch for.</b> ${escape(r.watchFor)}</p></div></div></div>
        ${last?ask('When people first meet you, which of these cards do they see?'):''}`);
    });
    section(3);
    mark('Going further');
    page('Going further',`<p class="lead">This blueprint shows how you are built. Two readings take it further.</p><div class="verdict"><b>The Timing Map · $39</b><p>Your cards laid across the next twelve months: your yearly themes, dated seasons, and the season you are in now.</p></div><div class="verdict"><b>The Card Blueprint Reading · $299</b><p>The complete reading: this blueprint and your timing, read together and written for you by your reader.</p></div>${ask('Which part of this blueprint do you want to understand next?')}`);
  };
  const blueprintFinePrint=()=>`<h3>How the cards were calculated</h3><p>${escape(bp.method.birthCard)}</p><p>${escape(bp.method.rulingCard)}</p><p>${escape(bp.method.year)}</p><p>The complete engine JSON export contains both cards and every sourced line used here.${bp.love.composed||bp.work.composed?' Love and Work use the card’s own core lines because the reading notes have no separate entry for it.':''}</p><h3>Reader review</h3><p>${draft.reviewed?'The reader marked this draft reviewed in the builder.':'This is a preparation draft. Review the sourced language, add the personal reading in the Writing tab, and check both cards against the engine JSON before delivery.'}</p><h3>What this is, and is not</h3><p>Interpretations describe patterns for reflection. They do not predict events or decide what you should do. The questions are there to be argued with.</p><p class="meta">${escape(bp.method.source)}</p>`;
  const blueprintContents=()=>`<div class="contents"><div><p class="eyebrow">Inside</p>${tocList()}</div><div><p class="eyebrow">The cards, decoded</p><dl class="key"><dt>Birth card <small>The engine</small></dt><dd>Solar value 55 − (2 × month + day) picks one of the 52 cards, or the Joker for December 31.</dd><dt>Ruling card <small>The paint job</small></dt><dd>A second card tied to your astrological sign. It colours how the birth card expresses itself. Some birthdays have two or three.</dd><dt>Birth year <small>Not used</small></dt><dd>Neither card depends on the year you were born.</dd></dl><p class="eyebrow">Your cards</p><p class="small">${escape(bc.name)}${bc.title?` · ${escape(bc.title)}`:''}, solar value ${bp.solarValue}. ${bp.joker?'No separate ruling card.':`Ruling: ${rulers.map(r=>escape(r.name)).join(' / ')}.`}</p></div></div><p class="howto">Read it straight through once. Then go back to the card that surprised you.</p>`;

  // Cover and contents. The contents body is filled in once every page number is known.
  page('Your private reading',blueprint?blueprintCover():`${BRAND}<h2>Your private reading</h2><p class="eyebrow">Private · Prepared for</p><p class="prepared">${escape(buyer.name)}</p><h1>${escape(offer.name)}</h1><p class="subtitle">${escape(copy.hook)}</p><dl class="facts"><dt>Reading date</dt><dd>${escape(engine.readingDate)}</dd><dt>Window</dt><dd>${escape(engine.window.start)} through ${escape(engine.window.end)}</dd><dt>People</dt><dd>${people.length}</dd></dl><div class="anchors cover-people" style="--people:${people.length}">${people.map(p=>`<div>${tile(p.identity[0].card,'lg')}<h3>${escape(p.name)}</h3><p>${escape(p.relation)}<br>${date(p.birthdate)}</p></div>`).join('')}</div><h3>How to read this document</h3><p><b>FIXED</b> is the reproducible calculation: every card and date here comes from the engine. <b>PATTERN</b> is sourced interpretation: a possible tendency, never a verdict. <b>YOURS</b> is a question with space to answer it.</p>`,compactCover?'cover compact':'cover');
  const contents=page('How to read this','');

  if(blueprint){
    blueprintChapters();
  }else if(draft.offer==='chemistry'){
    opener(0);mark(offer.sections[0]);people.forEach(p=>dossier(p,0));section(0);
    sideBySide(1);section(1);
    opener(1);mark(offer.sections[2]);timeline(2);rightNow(2);yearly(2);section(2);
    mark(offer.sections[3]);crossings(3,offer.sections[3]);section(3);
  }else if(draft.offer==='timing-map'){
    opener(0);mark(offer.sections[0]);dossier(buyer,0);yearly(0);section(0);
    mark(offer.sections[1]);timeline(1);
    let n=0;for(const group of chunks(buyer.windows,3))page(offer.sections[1],`${group.map(w=>season(w,++n)).join('')}`);
    section(1);
    if(individual){
      opener(1);mark(offer.sections[2]);rightNow(2);section(2);
      mark(offer.sections[3]);
      page(offer.sections[3],`${kicker(3)}<p class="lead">Keep the calendar nearby. Return to these questions as your seasons change.</p>${ask('Which yearly theme deserves your attention, and what would acting on it look like?')}${ask('Which dated transition will you use as a moment to pause and review?')}${ask('What do you want to practise now, and what will you check again at your next birthday?')}`);
      section(3);
    }else{
      opener(1);mark(offer.sections[2]);people.slice(1).forEach(p=>dossier(p,2));sideBySide(2);section(2);
      mark(offer.sections[3]);crossings(3,offer.sections[3]);section(3);
    }
  }else{
    opener(0);mark(offer.sections[0]);people.forEach(p=>dossier(p,0));section(0);
    sideBySide(1);section(1);
    opener(1);mark(offer.sections[2]);timeline(2);rightNow(2);yearly(2);crossings(2,offer.sections[2]);section(2);
    pattern(3);section(3);
  }

  if(!blueprint)mark('The full calendar');
  for(const p of people){
    page(`The full calendar / ${nameOf(p)}`,`<p class="meta">${range(engine.window)} · each row is clipped to the report window</p><table><thead><tr><th>Dates</th><th>Season</th><th>Birth card</th><th>Ruling card(s)</th></tr></thead><tbody>${p.windows.map(w=>`<tr><td>${range(w)}</td><td><i class="dot" style="background:${PLANET_COLOR[w.planet]}"></i>${escape(w.planet)}<br><small>Age ${w.cycleAge}</small></td><td>${card(w.cards[0].card)}</td><td>${w.cards.slice(1).map(c=>card(c.card)).join(' / ')||'None'}</td></tr>`).join('')}</tbody></table>`);
  }
  if(draft.includeNotes)writing('Reader notes',draft.notes);
  mark('The fine print');
  page('The fine print',blueprint?blueprintFinePrint():`<h3>How the cards were calculated</h3><p>${escape(engine.method.periods)}</p>${individual?'':`<p>${escape(engine.method.connections)}</p>`}<p>The complete engine JSON export contains ${individual?'your birthday cycles, periods, cards, and sourced card meanings':'every person, birthday cycle, period, card, connection, and sourced card meaning'} used here. Tables and section facts are generated from that same data.</p><h3>Reader review</h3><p>${draft.reviewed?'The reader marked this draft reviewed in the builder.':'This is a preparation draft. Review the sourced language, add the personal reading in the Writing tab, and check every date and card against the engine JSON before delivery.'}</p><h3>What this is, and is not</h3><p>Interpretations describe patterns for reflection. ${individual?'They do not predict events or decide what you should do.':'The card matches do not establish relationship outcomes.'} The questions are there to be argued with.</p><p class="meta">${escape(engine.method.source)}</p>`);

  pages[contents-1].body=blueprint?blueprintContents():`<div class="contents"><div><p class="eyebrow">Inside</p>${tocList()}</div><div><p class="eyebrow">The positions, decoded</p><dl class="key">${['Long Range','Pluto','Result','Environment','Displacement'].map(k=>`<dt>${escape(k)} <small>${escape(POSITION[k][0])}</small></dt><dd>${escape(POSITION[k][1])}</dd>`).join('')}</dl><p class="eyebrow">${individual?'Birthday seasons':'The seven seasons'}</p><p class="small">Every birthday starts six 52-day seasons, then Neptune continues through the eve of the next birthday. ${individual?'The rolling report window can cross a birthday, so a season may appear twice. ':''}Each season is run by a planet: ${Object.keys(PLANET_COLOR).map(planet=>`<span class="nowrap"><i class="dot" style="background:${PLANET_COLOR[planet]}"></i>${planet} (${POSITION[planet][0].toLowerCase()})</span>`).join(', ')}.</p></div></div><p class="howto">Read it straight through once. Then go back to the dates.</p>`;

  const html=pages.map((item,index)=>`<section class="page ${item.extra}" id="page-${index+1}"><header><span>CARD BLUEPRINTS / ${escape(offer.name.toUpperCase())}</span><span>+ ${String(index+1).padStart(2,'0')} +</span></header><h2>${escape(item.title)}</h2>${item.body}<footer><span>${FOOTER}</span><span>${escape(draft.reviewed?'Reader reviewed':'Reader review draft')} · ${escape(draft.readingDate)}</span></footer></section>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>${escape(buyer.name)} · ${escape(offer.name)}</title><style>
:root{color-scheme:light;--paper:#eef3f8;--paper-deep:#e2eaf3;--ivory:#f8fbfd;--ink:#123a63;--ink-soft:#3c6089;--ink-faint:#4a6b8f;--line:rgba(18,58,99,.16);--line-strong:rgba(18,58,99,.28);--bronze:#735624;--bronze-on-dark:#c4a05a;--gold:#b8893d;--dark:#0a3159;--on-dark:#e8f1fa;--on-dark-soft:#a9c2da;--card-ink:#14110d;--card-red:#8e321f;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;--serif:"Iowan Old Style","Palatino Linotype",Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:#d5dfea;color:var(--ink);font:15px/1.55 var(--serif)}main{max-width:850px;margin:auto}
.page{position:relative;background:var(--paper);padding:42px 46px 62px;margin:24px 0;min-height:980px;border-top:8px solid var(--ink);break-after:page;overflow-wrap:anywhere}.page:last-child{break-after:auto}
header,footer,.eyebrow,.meta,small,.band i,.months span,.today,.toc li b,.when small,.tiles figcaption,.dial small,.asks li:before,.margin span,th{font-family:var(--sans)}
header,footer{display:flex;justify-content:space-between;gap:16px;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);border-bottom:1px solid var(--line-strong);padding-bottom:13px}
footer{position:absolute;bottom:22px;left:46px;right:46px;border-bottom:0;border-top:1px solid var(--line-strong);padding:10px 0 0;font-weight:500;letter-spacing:.14em}
h1{font-size:52px;line-height:1.05;margin:14px 0 8px;letter-spacing:-.02em;color:var(--ink)}h2{font-size:28px;line-height:1.2;margin:27px 0 14px;letter-spacing:-.015em;color:var(--ink)}h3{font-size:21px;margin:14px 0 8px;color:var(--ink)}h3 small{font-size:11px;color:var(--ink-faint);font-weight:400;letter-spacing:.02em}
p{margin:10px 0;color:var(--ink-soft)}b{color:var(--ink)}.page p.meta,.meta,small{font-size:11px;color:var(--ink-faint);margin:4px 0 10px}.small{font-size:14px}
.page p.eyebrow,.eyebrow{font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--bronze);margin:18px 0 6px}.kicker{margin:16px 0 0}.kicker b{color:var(--bronze)}
.lead{font-size:17px;line-height:1.45;color:var(--ink);margin:6px 0 16px;max-width:640px}.gloss{font-size:13px;color:var(--ink-faint);font-style:italic}.big{font-size:21px;line-height:1.3;color:var(--ink)}
.card-code{font-size:22px;white-space:nowrap;color:var(--card-ink)}.suit-red{color:var(--card-red)}.suit-ink{color:var(--card-ink)}
.tile{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;width:58px;height:82px;border:1px solid var(--line-strong);border-radius:5px;background:var(--ivory);color:var(--card-ink);box-shadow:0 1px 2px rgba(18,58,99,.18),0 4px 12px rgba(18,58,99,.12)}
.tile i{position:absolute;top:4px;left:6px;font:600 13px/1 var(--serif);font-style:normal;text-align:center}.tile i.flip{top:auto;left:auto;bottom:4px;right:6px;transform:rotate(180deg)}.tile b{font-size:30px;color:inherit;font-weight:400}
.tile.face{border:1px solid var(--line-strong);background-color:#fff;background-size:cover;background-position:center;background-repeat:no-repeat;overflow:hidden}
.tile.red{color:var(--card-red)}.tile.sm{width:46px;height:64px;border-radius:4px}.tile.sm i.flip{display:none}.tile.sm b{font-size:22px}.tile.sm i{font-size:11px}.tile.lg{width:96px;height:136px;border-radius:7px}.tile.lg b{font-size:52px}.tile.lg i{font-size:20px;top:7px;left:9px}.tile.lg i.flip{bottom:7px;right:9px}
.reflection{margin-top:22px;padding:14px 0;border-top:1px solid var(--line-strong);font-size:13px;color:var(--ink)}.writing-line{height:30px;border-bottom:1px solid var(--line-strong)}
.divider{display:flex;align-items:center;gap:18px;color:var(--bronze);margin:22px 0}.divider:before,.divider:after{content:'';height:1px;background:var(--line-strong);flex:1}
.brand{display:flex;align-items:center;gap:9px;margin:26px 0 0;color:var(--ink)}.brand-mark{width:26px;height:26px;flex:none}.brand-word{font-family:var(--sans);font-weight:500;font-size:19px;letter-spacing:.005em;color:var(--ink)}
.cover>h2:first-of-type{display:none}.cover h2{margin:18px 0 10px}.prepared{font-size:30px;line-height:1.1;color:var(--ink);margin:0}.subtitle{font-size:24px;line-height:1.25;color:var(--ink-soft);margin:6px 0 14px;max-width:620px}
.facts{display:grid;grid-template-columns:160px 1fr;gap:7px;margin:18px 0}.facts dt{font-weight:bold;color:var(--ink)}.facts dd{margin:0;color:var(--ink)}
.anchors{display:flex;gap:28px;flex-wrap:wrap;border-block:1px solid var(--line-strong);padding:16px 0;margin:0 0 6px}.cover-people{display:grid;grid-template-columns:repeat(var(--people),minmax(0,1fr));gap:20px}.cover-people>div{min-width:0}.cover-people h3{font-size:19px;margin:12px 0 2px}.cover-people p{font-size:13px;color:var(--ink-faint);margin:0}
.cover.compact h1{font-size:44px}.cover.compact .subtitle{font-size:20px}.cover.compact .prepared{font-size:24px}.cover.compact .tile.lg{width:70px;height:100px}.cover.compact .cover-people h3{font-size:16px;line-height:1.2}.cover.compact .cover-people p{font-size:12px;line-height:1.3}
.contents{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;margin-top:6px}.toc{list-style:none;padding:0;margin:0}.toc li{display:flex;align-items:baseline;gap:8px;padding:6px 0;font-size:15px;color:var(--ink-soft)}.toc li i{flex:1;border-bottom:1px dotted var(--line-strong)}.toc li b{font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--ink-faint)}.toc li.part{margin-top:12px;font-size:17px;color:var(--ink);font-weight:bold}
.key{margin:0}.key dt{font-size:16px;color:var(--ink);font-weight:bold;margin-top:8px}.key dt small{color:var(--bronze);font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:9px;margin-left:4px}.key dd{margin:0 0 4px;font-size:13.5px;color:var(--ink-soft)}.nowrap{white-space:nowrap}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle;border:1px solid rgba(18,58,99,.25)}.howto{margin-top:40px;text-align:center;font-size:20px;font-style:italic;color:var(--ink)}
.opener header,.cover header{position:static}.opener{display:flex;flex-direction:column;text-align:center}.opener>h2{display:none}.opener-glyph{font-size:150px;line-height:1;color:var(--ink);opacity:.12;margin:70px 0 0}.opener-glyph.red{color:var(--card-red)}
.numeral{letter-spacing:.4em;margin:8px 0 0}.display{font-size:50px;line-height:1.05;letter-spacing:-.02em;color:var(--ink);margin:12px auto 10px;max-width:640px}.opener .lead{margin:0 auto;font-size:21px;max-width:560px;color:var(--ink-soft)}
.asks{list-style:none;counter-reset:a;padding:0;margin:0 auto;max-width:520px;text-align:left}.asks li{counter-increment:a;display:flex;gap:16px;padding:9px 0;border-bottom:1px solid var(--line);font-size:17px;color:var(--ink)}.asks li:before{content:counter(a,upper-roman);font-size:11px;font-weight:600;line-height:2;color:var(--bronze);min-width:22px}
.dossier-head{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:start;margin-top:10px}.tiles{display:flex;gap:16px;align-items:flex-end}.tiles figure{margin:0;text-align:center}.tiles figcaption{font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);margin-top:10px}.archetype{font-size:28px;margin:0 0 6px}
.dial{display:grid;grid-template-columns:1fr 1.25fr 1fr;border:1px solid var(--line-strong);background:var(--ivory)}.dial>div{padding:12px 14px;font-size:13.5px;line-height:1.45}.dial>div+div{border-left:1px solid var(--line-strong)}.dial small{display:block;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);font-size:9px;font-weight:600;margin:0}.dial .best{background:var(--paper)}.dial .best small{color:var(--bronze)}.dial p{margin:6px 0 0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:30px}.two p{font-size:14px}.gifts{margin:0;padding-left:18px;font-size:14px;color:var(--ink-soft)}.gifts li{margin:3px 0}.gifts li::marker{color:var(--bronze);content:'✦  '}
.rows{border-top:1px solid var(--line-strong)}.row{display:grid;grid-template-columns:auto 1fr;gap:20px;padding:12px 0;border-bottom:1px solid var(--line);break-inside:avoid}.row p{margin:5px 0;font-size:14px}.row h3{margin:0 0 2px}.tight .row{padding:9px 0}.tight .row p{font-size:13.5px;margin:4px 0}
.verdict{border:2px solid var(--ink);background:var(--ivory);padding:18px 22px;margin-top:10px;break-inside:avoid}.verdict b{font-size:22px;display:block}.verdict p{font-size:15px;margin:8px 0 0}
.timeline{position:relative;margin:30px 0 10px;padding-top:24px}.months{position:absolute;top:0;left:120px;right:0;height:20px}.months span{position:absolute;font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);border-left:1px solid var(--line-strong);padding-left:4px;height:100%}
.lane{display:grid;grid-template-columns:120px 1fr;align-items:center;margin:14px 0}.lane p{margin:0;font-size:18px;color:var(--ink);font-weight:bold}.lane p small{display:block;font-weight:400;color:var(--ink-faint);margin:0}
.long-labels .lane{grid-template-columns:200px 1fr}.long-labels .lane p{font-size:14px;line-height:1.35}.long-labels .months,.long-labels .today{left:200px}
.band{display:flex;height:58px;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px var(--line-strong)}.band span{display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:0;overflow:hidden;color:var(--dark);border-right:1px solid var(--paper)}.band b{color:var(--dark);font-size:17px;line-height:1}.band span.narrow b{font-size:13px}.band span.narrow i{display:none}.band i{font-size:8px;font-style:normal;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.today{position:absolute;top:22px;bottom:-14px;left:120px;border-left:2px solid var(--ink);padding-left:6px;font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink);display:flex;align-items:flex-end}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;margin:30px 0 0;font-size:14px;color:var(--ink)}.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px;border:1px solid rgba(18,58,99,.25)}.legend small{color:var(--ink-faint);font-family:var(--serif);font-size:12px}
.season{display:grid;grid-template-columns:52px 1fr auto;gap:18px;padding:12px 0 14px;border-bottom:1px solid var(--line);break-inside:avoid}.season-no{font-size:38px;font-weight:bold;line-height:1;opacity:.85}.season p{margin:5px 0;font-size:14px}.season .q{font-style:italic;color:var(--ink);font-size:15px}
.now{display:grid;grid-template-columns:auto 1fr;gap:26px;padding:14px 0;border-bottom:1px solid var(--line)}.now p{font-size:14.5px}.now.compact{padding:9px 0}.now.compact p{font-size:13.5px;margin:4px 0}.now.compact .meta{margin:2px 0 6px}.now.compact h3{font-size:19px}
.headline{display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;padding:14px 0 18px;border-bottom:1px solid var(--line-strong)}.headline .eyebrow{margin-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 30px}.cell{position:relative;padding:4px 60px 12px 0;border-bottom:1px solid var(--line)}.cell .tile{position:absolute;top:22px;right:0}.cell p{font-size:13.5px;margin:6px 0}.cell .gloss{font-size:12.5px}
.crossing{display:grid;grid-template-columns:78px 1fr auto;gap:18px;padding:12px 0;border-bottom:1px solid var(--line);break-inside:avoid}.crossing h3{font-size:19px}.crossing p{font-size:14px;margin:5px 0}.crossing .detail{font-size:13px;color:var(--ink-faint);font-style:italic;margin:2px 0 6px}
.when{border-right:1px solid var(--line-strong);padding-right:12px}.when b{display:block;font-size:20px;line-height:1.1}.when span{display:block;font-size:13px;color:var(--ink-faint)}.when small{color:var(--ink-faint);font-size:10px}.crossing.mine{background:linear-gradient(90deg,var(--paper-deep),transparent 70%)}
.letter{display:grid;grid-template-columns:110px 1fr;gap:26px;margin-top:16px}.margin{border-right:1px solid var(--line-strong);padding-right:20px;text-align:right}.margin b{display:block;font-size:64px;line-height:1;color:var(--ink);opacity:.25;font-weight:400}.margin span{display:block;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);margin-top:12px}.margin small{color:var(--ink-faint);font-style:italic}
.personal-copy{font-size:15px;line-height:1.65;color:var(--ink-soft)}.personal-copy>div{min-height:1.65em}.personal-copy>div:first-child{color:var(--ink);font-style:italic}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border:1px solid var(--line-strong);padding:8px;vertical-align:top;color:var(--ink-soft)}th{font-weight:bold;color:var(--ink);font-size:11px;letter-spacing:.06em;text-transform:uppercase}td .card-code{font-size:20px}tr{break-inside:avoid}.ledger td{font-size:13px}.ledger td small{color:var(--ink-faint);font-family:var(--serif);font-size:12px}.ledger td:first-child,.ledger th{white-space:nowrap}
@page{size:A4;margin:0}@media print{body{background:var(--paper);print-color-adjust:exact;-webkit-print-color-adjust:exact}main{max-width:none}.page{min-height:296mm;padding:42px 46px 62px;margin:0}footer{left:46px;right:46px;bottom:22px}}
${[...usedFaces].map(code=>`.${faceClass(code)}{background-image:url('${cardFace(code)}')}`).join('')}
</style></head><body><main>${html.join('\n')}</main></body></html>`;
}
