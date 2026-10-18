// Renders a Chemistry Check, Timing Map, or Family Snapshot as one standalone HTML document.
// Every card, date, and card meaning comes from the engine data; the copy here only frames it.
import font from '../ui/fonts/CormorantGaramond.ttf';
import {cardFace} from './card-faces.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const red=code=>/[♥♦]/.test(code||'');
const card=code=>`<span class="card-code${red(code)?' red':''}">${escape(code||'None')}</span>`;
const faceClass=code=>`f-${code.slice(0,-1)}${'shdc'['♠♥♦♣'.indexOf(code.slice(-1))]}`;
let usedFaces=new Set();
const tile=(code,size='')=>{
  if(!code)return card(code);
  if(cardFace(code)){usedFaces.add(code);return `<span class="tile face ${faceClass(code)} ${size}" role="img" aria-label="${escape(code)}"></span>`;}
  const rank=escape(code.slice(0,-1)),suit=escape(code.slice(-1));
  return `<span class="tile ${size}${red(code)?' red':''}" aria-label="${escape(code)}"><i>${rank}<br>${suit}</i><b>${suit}</b><i class="flip">${rank}<br>${suit}</i></span>`;
};
const role=code=>code==='BC'?'birth card':code==='PRC1'?'ruling card':`ruling card ${code.slice(3)}`;
const date=value=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
const short=value=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
const range=item=>`${date(item.start)} – ${date(item.end)}`;
const days=(a,b)=>Math.round((Date.parse(`${b}T00:00:00Z`)-Date.parse(`${a}T00:00:00Z`))/86400000)+1;
const chunks=(items,size)=>Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
const SUITS=['♠','♥','♦','♣'];

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
  family:{hook:'Same house. Different cards. Here is how everyone is built.',parts:[
    {glyph:'♣',line:'Every family runs on a system. Nobody wrote it down. Until now.',asks:['How is each person built?','Where does the family move as one?','Where does it crack?']},
    {glyph:'♦',line:'Where everyone is this year, and where they land in yours.',asks:['What is each person going through right now?','Who shows up in your year, and as what?','Which pattern is ready to stop with you?']}]}
};

export function renderOfferReport(draft,engine,offer){
  usedFaces=new Set();
  const pages=[],toc=[],people=engine.people,buyer=people[0],copy=COPY[draft.offer];
  const person=id=>people.find(p=>p.id===id);
  const firsts=people.map(p=>p.name.split(/\s+/)[0]);
  const nameOf=p=>{const i=people.indexOf(p);return firsts.filter(n=>n===firsts[i]).length>1?p.name:firsts[i];};
  const who=p=>p===buyer?'You':escape(nameOf(p));
  const whose=p=>p===buyer?'your':`${escape(nameOf(p))}’s`;
  const cap=text=>text.charAt(0).toUpperCase()+text.slice(1);
  const meaning=(code,key='sweet_spot')=>escape(engine.meanings[code]?.[key]||'No sourced meaning is available for this card.');
  const ask=text=>`<aside class="ask"><span>Sit with this</span>${escape(text)}</aside>`;
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
  const kicker=(index,text=offer.sections[index])=>`<p class="kicker"><b>${SUITS[index]}</b> ${escape(text)}</p>`;
  const opener=index=>{
    const part=copy.parts[index];mark(`Part ${index?'II':'I'} · ${offer.parts[index]}`);
    page(`Part ${index?'II':'I'} · ${offer.parts[index]}`,`<div class="opener-glyph${part.glyph==='♥'||part.glyph==='♦'?' red':''}">${part.glyph}</div><p class="numeral">Part ${index?'II':'I'}</p><p class="display">${escape(offer.parts[index])}</p><p class="lead">${escape(part.line)}</p><div class="divider">✦</div><p class="label">This part answers</p><ol class="asks">${part.asks.map(q=>`<li>${escape(q)}</li>`).join('')}</ol>`,'opener');
  };

  // Identity dossier: the card, its best version, and both ways it goes wrong.
  const dossier=(p,index)=>{
    const id=p.identity[0],d=id.description||{},m=id.meaning||{};
    const gifts=(d.gifts||'').split('\n').map(line=>line.replace(/^[-•]\s*/,'').trim()).filter(Boolean).slice(0,4);
    page(p===buyer?'You, by the cards':`${nameOf(p)}, by the cards`,`${kicker(index)}<div class="dossier-head"><div class="tiles">${p.identity.map(item=>`<figure>${tile(item.card,item===id?'lg':'')}<figcaption>${escape(role(item.role))}</figcaption></figure>`).join('')}</div><div><p class="meta">${escape(p.relation)} · Born ${date(p.birthdate)}</p><h3 class="archetype">${escape(d.title||id.card)}</h3><p>${escape(d.core_identity||'No sourced identity description available.')}</p></div></div>
      <p class="label">The dial</p><div class="dial"><div><small>Under stress</small><p>${escape(m.under||'No sourced meaning available.')}</p></div><div class="best"><small>At ${p===buyer?'your':'their'} best</small><p>${escape(m.sweet_spot||'No sourced meaning available.')}</p></div><div><small>Pushed too far</small><p>${escape(m.over||'No sourced meaning available.')}</p></div></div>
      <div class="two">${gifts.length?`<div><p class="label">Built-in gifts</p><ul class="gifts">${gifts.map(g=>`<li>${escape(g)}</li>`).join('')}</ul></div>`:''}${d.shadow?`<div><p class="label">The shadow</p><p>${escape(d.shadow)}</p></div>`:''}</div>
      ${p===buyer?ask('Which end of the dial did the people closest to you get this past month?'):''}`);
  };

  // Click and clash: the same sourced fork, laid side by side so the reader does the comparing.
  const sideBySide=index=>{
    mark(offer.sections[index]);
    page('Where you click',`${kicker(index)}<p class="lead">Put everyone’s best version in one room. This is what it sounds like.</p><div class="rows">${people.map(p=>`<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)}</h3><p>${meaning(p.identity[0].card)}</p></div></div>`).join('')}</div>${ask('Which of these lines describes something the others secretly rely on?')}`);
    page('Where you clash',`${kicker(index)}<p class="lead">Now the low roads. Clashes rarely start with the big stuff. They start where one person’s stress meets another person’s excess.</p><div class="rows">${people.map(p=>`<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)}</h3><p><b>Under stress.</b> ${meaning(p.identity[0].card,'under')}</p><p><b>Pushed too far.</b> ${meaning(p.identity[0].card,'over')}</p></div></div>`).join('')}</div>${ask(people.length>2?'Whose low road does the whole house quietly organise itself around?':'When you two clash, whose low road shows up first?')}`);
    const links=chunks(engine.identityLinks,4);
    if(!links.length)links.push([]);
    for(const [i,group] of links.entries())page(i?'Shared cards / continued':'Shared cards',`${kicker(index)}${i?'':'<p class="lead">Exact matches between your core cards. Rare, and worth noticing when they happen.</p>'}${group.length?`<div class="rows">${group.map(link=>`<div class="row">${tile(link.card,'sm')}<div><h3>${who(person(link.a))} &amp; ${escape(person(link.b)===buyer?'you':nameOf(person(link.b)))}</h3><p class="meta">${cap(whose(person(link.a)))} ${escape(role(link.aRole))} is ${whose(person(link.b))} ${escape(role(link.bRole))}</p><p>${meaning(link.card)}</p></div></div>`).join('')}</div>`:`<div class="verdict"><b>No shared cards.</b><p>Nobody here holds anyone else’s birth or ruling card. You are built from different material. Neither good nor bad, it just means the connection has to be made on purpose. The dated crossings later in this reading show where it happens on its own.</p></div>`}`);
  };

  // One page that shows the whole year: one band per person, segments sized by days.
  const timeline=index=>{
    const total=days(engine.window.start,engine.window.end);
    const months=[];for(let d=new Date(`${engine.window.start}T12:00:00Z`);months.length<12;d.setUTCMonth(d.getUTCMonth()+1,1))months.push(new Date(d));
    const pct=value=>(days(engine.window.start,value)-1)/total*100;
    page('The year on one page',`${kicker(index)}<p class="lead">Twelve months, ${people.length>1?'one band per person':'seven seasons'}. Each colour is a season. Each card is what that season is about.</p>
      <div class="timeline"><div class="months">${months.map(m=>({left:pct(m.toISOString().slice(0,10)),label:m.toLocaleString('en-US',{month:'short',timeZone:'UTC'})})).filter((m,i,all)=>!all[i+1]||all[i+1].left-m.left>5).map(m=>`<span style="left:${m.left.toFixed(2)}%">${m.label}</span>`).join('')}</div>
      ${people.map(p=>`<div class="lane"><p>${who(p)} <small>${escape(p.identity[0].card)}</small></p><div class="band">${p.windows.map(w=>`<span class="${days(w.start,w.end)/total<0.07?'narrow':''}" style="width:${(days(w.start,w.end)/total*100).toFixed(2)}%;background:${PLANET_COLOR[w.planet]}" title="${escape(w.planet)} ${escape(w.cards[0].card)}"><b>${escape(w.cards[0].card)}</b><i>${escape(w.planet.slice(0,3))}</i></span>`).join('')}</div></div>`).join('')}
      <div class="today">Today · ${short(engine.window.start)}</div></div>
      <div class="legend">${Object.entries(PLANET_COLOR).map(([planet,color])=>`<span><i style="background:${color}"></i>${planet} <small>${POSITION[planet][0]}</small></span>`).join('')}</div>
      ${ask(people.length>1?'Find the stretch where everyone changes season within a few weeks of each other. What usually happens in your life when that many things shift at once?':'Twelve months from now, what will you wish you had started today?')}`);
  };

  const season=(w,n)=>`<article class="season"><div class="season-no" style="color:${PLANET_COLOR[w.planet]}">${String(n).padStart(2,'0')}</div><div><h3>${escape(w.planet)} <small>${escape(POSITION[w.planet][0])}</small></h3><p class="meta">${range(w)} · ${days(w.start,w.end)} days${w.start!==w.fullStart||w.end!==w.fullEnd?` · full season ${short(w.fullStart)} – ${short(w.fullEnd)}`:''}</p><p><b>Best use.</b> ${meaning(w.cards[0].card)}</p><p><b>Watch for.</b> ${meaning(w.cards[0].card,'under')}</p><p class="q">${escape(SEASON_QUESTION[w.planet])}</p></div>${tile(w.cards[0].card)}</article>`;

  const rightNow=index=>{
    for(const [i,group] of chunks(people,4).entries())page(i?'Right now / continued':'Right now',`${kicker(index)}${i?'':`<p class="lead">As of ${date(engine.readingDate)}. This is the season each of you is standing in today.</p>`}${group.map(p=>{const w=p.windows.find(item=>item.start<=engine.readingDate&&item.end>=engine.readingDate);return `<article class="now${people.length>3?' compact':''}">${tile(w.cards[0].card,people.length>3?'':'lg')}<div><h3>${who(p)} <small>· ${escape(w.planet)}, ${escape(POSITION[w.planet][0])}</small></h3><p class="meta">Started ${date(w.fullStart)} · ${days(engine.readingDate,w.fullEnd)} days left</p><p><b>Best use.</b> ${meaning(w.cards[0].card)}</p><p><b>Watch for.</b> ${meaning(w.cards[0].card,'under')}</p></div></article>`;}).join('')}${i===0?ask('Read these together. Is anyone in a season that makes the others harder to live with right now?'):''}`);
  };

  const yearly=index=>{
    for(const cycle of buyer.cycles){
      const anchor=cycle.anchors[0];
      const cell=(label,code)=>`<article class="cell"><p class="label">${escape(POSITION[label][0])} · ${escape(label)}</p>${tile(code,'sm')}<p class="gloss">${escape(POSITION[label][1])}</p><p>${code?meaning(code):'Fixed card: no annual Environment or Displacement pair is assigned.'}</p></article>`;
      page(`Your year at ${cycle.age}`,`${kicker(index)}<p class="meta">Birthday year ${range(cycle)}${cycle.projection?' · canonical 90-board projection':''}</p><div class="headline">${tile(anchor.longRangeCard,'lg')}<div><p class="label">The headline · Long Range</p><p class="big">${meaning(anchor.longRangeCard)}</p><p class="gloss">${escape(POSITION['Long Range'][1])}</p></div></div><div class="grid">${cell('Pluto',anchor.walk[7])}${cell('Result',anchor.walk[8])}${cell('Environment',anchor.annual?.environment)}${cell('Displacement',anchor.annual?.displacement)}</div>${cycle===buyer.cycles[0]?ask('If the headline above were the only thing people remembered about your year, would you be proud of it?'):''}`);
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
    const groups=chunks(mine,3);
    if(!groups.length&&!others.length)groups.push([]);
    const lead=`<p class="lead">${connections.length?`${connections.length} crossing${connections.length===1?'':'s'} in the next twelve months. ${mine.length?`${mine.length} of them run through you.`:'None of them run through you.'}`:'The calendar, checked for crossings.'}</p>`;
    for(const [i,group] of groups.entries())page(i?`${title} / continued`:title,`${title===offer.sections[index]?'':kicker(index)}${i?'':lead}${group.length?group.map(item=>`<article class="crossing mine"><div class="when"><b>${short(item.start)}</b><span>to ${short(item.end)}</span><small>${new Date(`${item.start}T12:00:00Z`).getUTCFullYear()}</small></div><div><h3>${item.line}</h3><p class="detail">${item.detail}</p><p>${meaning(item.card)}</p></div>${tile(item.card,'sm')}</article>`).join(''):`<div class="verdict"><b>A quiet year between you.</b><p>No exact identity-to-position matches or identical birth-anchor card overlaps fall inside this 12-month window. Nobody is written into anyone else’s year. Whatever happens, you will have chosen it.</p></div>`}${i===groups.length-1&&group.length?ask('Who is in your year by accident, and who is there on purpose?'):''}`);
    for(const [i,group] of chunks(others,9).entries())page(`Meanwhile, between the others${i?' / continued':''}`,`${i||groups.length?'':lead}${i?'':'<p class="lead">You are not in these, but you will feel them. When two people around you are working the same card, the room changes.</p>'}<table class="ledger"><thead><tr><th>Dates</th><th>Who</th><th>Card</th></tr></thead><tbody>${group.map(item=>`<tr><td>${short(item.start)} – ${short(item.end)}<br><small>${new Date(`${item.start}T12:00:00Z`).getUTCFullYear()}</small></td><td>${item.line}<br><small>${item.detail}</small></td><td>${card(item.card)}</td></tr>`).join('')}</tbody></table>`);
  };

  const pattern=index=>{
    mark(offer.sections[index]);
    page('The pattern, and the way out',`${kicker(index)}<p class="lead">Every card has a shadow it falls back on and a direction it is learning toward. Line them up and the family script shows.</p><div class="rows tight">${people.map(p=>{const d=p.identity[0].description||{};return `<div class="row">${tile(p.identity[0].card,'sm')}<div><h3>${who(p)} <small>· ${escape(d.title||p.identity[0].card)}</small></h3><p><b>The pattern.</b> ${escape(d.shadow||'No sourced shadow available.')}</p><p><b>The way out.</b> ${escape(d.life_direction||'No sourced direction available.')}</p></div></div>`;}).join('')}</div>${ask('Which of these patterns did you inherit, and which one is ready to stop with you?')}`);
  };

  // Cover and contents. The contents body is filled in once every page number is known.
  page(offer.name,`<div class="wordmark">MY CARD BLUEPRINT</div><div class="suits">♠ &nbsp; <em>♥</em> &nbsp; <em>♦</em> &nbsp; ♣</div><h1>${escape(offer.name)}</h1><p class="hook">${escape(copy.hook)}</p><div class="cover-people">${people.map(p=>`<div>${tile(p.identity[0].card,'lg')}<h3>${escape(p.name)}</h3><p>${escape(p.relation)}<br>${date(p.birthdate)}</p></div>`).join('')}</div><div class="divider">✦</div><p class="prepared">Prepared for ${escape(buyer.name)}</p><p class="window">${range(engine.window)}</p>`,'cover');
  const contents=page('How to read this','');

  if(draft.offer==='chemistry'){
    opener(0);mark(offer.sections[0]);people.forEach(p=>dossier(p,0));section(0);
    sideBySide(1);section(1);
    opener(1);mark(offer.sections[2]);timeline(2);rightNow(2);yearly(2);section(2);
    mark(offer.sections[3]);crossings(3,offer.sections[3]);section(3);
  }else if(draft.offer==='timing-map'){
    opener(0);mark(offer.sections[0]);dossier(buyer,0);yearly(0);section(0);
    mark(offer.sections[1]);timeline(1);
    let n=0;for(const group of chunks(buyer.windows,3))page(offer.sections[1],`${group.map(w=>season(w,++n)).join('')}`);
    section(1);
    opener(1);mark(offer.sections[2]);people.slice(1).forEach(p=>dossier(p,2));sideBySide(2);section(2);
    mark(offer.sections[3]);crossings(3,offer.sections[3]);section(3);
  }else{
    opener(0);mark(offer.sections[0]);people.forEach(p=>dossier(p,0));section(0);
    sideBySide(1);section(1);
    opener(1);mark(offer.sections[2]);timeline(2);rightNow(2);yearly(2);crossings(2,offer.sections[2]);section(2);
    pattern(3);section(3);
  }

  mark('The full calendar');
  for(const p of people){
    page(`The full calendar / ${nameOf(p)}`,`<p class="meta">${range(engine.window)} · each row is clipped to the report window</p><table><thead><tr><th>Dates</th><th>Season</th><th>Birth card</th><th>Ruling card(s)</th></tr></thead><tbody>${p.windows.map(w=>`<tr><td>${range(w)}</td><td><i class="dot" style="background:${PLANET_COLOR[w.planet]}"></i>${escape(w.planet)}<br><small>Age ${w.cycleAge}</small></td><td>${card(w.cards[0].card)}</td><td>${w.cards.slice(1).map(c=>card(c.card)).join(' / ')||'None'}</td></tr>`).join('')}</tbody></table>`);
  }
  if(draft.includeNotes)writing('Reader notes',draft.notes);
  mark('The fine print');
  page('The fine print',`<h3>How the cards were calculated</h3><p>${escape(engine.method.periods)}</p><p>${escape(engine.method.connections)}</p><p>The complete engine JSON export contains every person, birthday cycle, period, card, connection, and sourced card meaning used here. Tables and section facts are generated from that same data.</p><h3>Reader review</h3><p>${draft.reviewed?'The reader marked this draft reviewed in the builder.':'This is a preparation draft. Review the sourced language, add the personal reading in the Writing tab, and check every date and card against the engine JSON before delivery.'}</p><h3>What this is, and is not</h3><p>Interpretations describe patterns for reflection. The card matches do not establish relationship outcomes. The questions are there to be argued with.</p><p class="meta">${escape(engine.method.source)}</p>`);

  pages[contents-1].body=`<div class="contents"><div><p class="label">Inside</p><ol class="toc">${toc.map(item=>`<li class="${/^Part/.test(item.label)?'part':''}"><span>${escape(item.label)}</span><i></i><b>${String(item.number).padStart(2,'0')}</b></li>`).join('')}</ol></div><div><p class="label">The positions, decoded</p><dl class="key">${['Long Range','Pluto','Result','Environment','Displacement'].map(k=>`<dt>${escape(k)} <small>${escape(POSITION[k][0])}</small></dt><dd>${escape(POSITION[k][1])}</dd>`).join('')}</dl><p class="label">The seven seasons</p><p class="small">Every birthday starts seven 52-day seasons, each run by a planet: ${Object.keys(PLANET_COLOR).map(planet=>`<span class="nowrap"><i class="dot" style="background:${PLANET_COLOR[planet]}"></i>${planet} (${POSITION[planet][0].toLowerCase()})</span>`).join(', ')}.</p></div></div><p class="howto">Read it straight through once. Then go back to the dates.</p>`;

  const html=pages.map((item,index)=>`<section class="page ${item.extra}" id="page-${index+1}"><header><span>MY CARD BLUEPRINT</span><span>${String(index+1).padStart(2,'0')}</span></header><h2>${escape(item.title)}</h2>${item.body}<footer><span>${escape(draft.reviewed?'Reader reviewed':'Reader review draft')}</span><span>MY CARD BLUEPRINT · ${escape(draft.readingDate)}</span></footer></section>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>${escape(buyer.name)} · ${escape(offer.name)}</title><style>
@font-face{font-family:Cormorant;src:url('${font}') format('truetype');font-weight:300 700;font-display:block}
:root{color-scheme:dark;--navy:#0b1430;--navy-2:#121d40;--gold:#d9b968;--gold-light:#e6c675;--paper:#e8e0d0;--muted:#b6b1ad;--coral:#dfa08a;--line:#d9b96855;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
*{box-sizing:border-box}body{margin:0;background:#19213b;color:var(--paper);font:19px/1.45 Cormorant,Georgia,serif}main{max-width:850px;margin:auto}
.page{position:relative;min-height:1100px;margin:20px 0;padding:36px 48px 70px;background:var(--navy);break-after:page;overflow-wrap:anywhere}.page:last-child{break-after:auto}
header,footer,.meta,small,.label,.kicker,.ask span{font-family:var(--sans);letter-spacing:.02em}header,footer{display:flex;justify-content:space-between;color:var(--gold);border-bottom:1px solid var(--line);padding-bottom:12px;letter-spacing:.14em;font-size:10px;line-height:1.6}
footer{position:absolute;bottom:22px;left:48px;right:48px;border-bottom:0;border-top:1px solid var(--line);padding:12px 0 0;font-size:9px}
h1,h2,h3{color:var(--gold-light);font-weight:600;text-wrap:balance}.lead,.hook,.ask{text-wrap:balance}h1{font-size:58px;line-height:1.05;margin:30px 0}h2{font-size:38px;line-height:1.1;margin:8px 0 18px}h3{font-size:24px;line-height:1.2;margin:4px 0 8px}h3 small{font-size:11px;color:var(--muted);font-weight:400}
p{margin:10px 0}b{color:var(--gold-light);font-weight:600}.page p.meta,.meta{font-size:10px;line-height:1.6;color:var(--muted);margin:6px 0 12px}small{font-size:10px}.small{font-size:16px}
.page p.label,.label{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:22px 0 8px}.kicker{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:26px 0 0}.kicker b{color:var(--gold);font-size:13px}
.lead{font-size:22px;line-height:1.35;font-style:italic;color:#f1ead9;margin:4px 0 20px;max-width:640px}.gloss{font-style:italic;color:var(--muted);font-size:16px}.big{font-size:24px;line-height:1.3;color:#f1ead9}
.card-code{font:600 26px/1.2 Cormorant,Georgia,serif;color:var(--gold-light);white-space:nowrap}.card-code.red,.red{color:var(--coral)}
.tile{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;width:58px;height:82px;border:1px solid var(--gold);border-radius:6px;background:linear-gradient(160deg,#16224a,#0d1735);color:var(--gold-light);box-shadow:0 0 0 3px var(--navy),0 0 0 4px #d9b96833}
.tile i{position:absolute;top:4px;left:6px;font:600 13px/1 Cormorant,Georgia,serif;font-style:normal;text-align:center}.tile i.flip{top:auto;left:auto;bottom:4px;right:6px;transform:rotate(180deg)}.tile b{font-size:30px;color:inherit;font-weight:400}
.tile.face{border:0;background-color:#fff;background-size:cover;background-position:center;background-repeat:no-repeat;overflow:hidden;box-shadow:0 1px 2px #0008,0 6px 16px #00000066,0 0 0 1px #d9b96840}.tile.face img{display:block;width:100%;height:100%;object-fit:cover}.tile.red{color:var(--coral);border-color:#dfa08aaa}.tile.sm{width:46px;height:64px}.tile.sm i.flip{display:none}.tile.sm b{font-size:22px}.tile.sm i{font-size:11px}.tile.lg{width:96px;height:136px;border-radius:9px}.tile.lg b{font-size:52px}.tile.lg i{font-size:20px;top:7px;left:9px}.tile.lg i.flip{bottom:7px;right:9px}
.ask{margin:26px 0 0;padding:16px 20px 16px 22px;border-left:2px solid var(--gold);background:linear-gradient(90deg,#d9b96814,transparent);font-size:22px;font-style:italic;line-height:1.3;color:#f1ead9}.ask span{display:block;font-style:normal;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.divider{display:flex;align-items:center;gap:18px;color:var(--gold);margin:26px 0}.divider:before,.divider:after{content:'';height:1px;background:var(--line);flex:1}
.cover{display:flex;flex-direction:column;justify-content:center;text-align:center;background:radial-gradient(ellipse at 50% 38%,#18275a 0%,var(--navy) 62%)}.cover>h2,.opener>h2{display:none}.wordmark{font-size:20px;letter-spacing:.3em;color:var(--gold);margin:0 0 12px}.suits{color:var(--gold);letter-spacing:.35em}.suits em{font-style:normal;color:var(--coral)}
.cover h1{font-size:66px;margin:40px 0 18px}.hook{font-size:26px;font-style:italic;color:#f1ead9;max-width:560px;margin:0 auto 54px;line-height:1.3}
.cover-people{display:flex;flex-wrap:wrap;justify-content:center;gap:34px}.cover-people>div{min-width:120px;max-width:190px}.cover-people h3{font-size:23px;margin:18px 0 2px}.cover-people p{font-size:15px;color:var(--muted);margin:0}
.prepared{font-size:24px;margin:0}.window{font:11px/1.6 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.contents{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;margin-top:10px}.toc{list-style:none;padding:0;margin:0}.toc li{display:flex;align-items:baseline;gap:8px;padding:7px 0;font-size:18px}.toc li i{flex:1;border-bottom:1px dotted var(--line)}.toc li b{font:600 11px var(--sans);letter-spacing:.1em}.toc li.part{margin-top:14px;font-size:20px;color:var(--gold-light);font-weight:600}
.key{margin:0}.key dt{font-size:19px;color:var(--gold-light);font-weight:600;margin-top:8px}.key dt small{color:var(--muted);font-weight:400;letter-spacing:.1em;text-transform:uppercase;font-size:9px}.key dd{margin:0 0 4px;font-size:16px;color:var(--muted)}.nowrap{white-space:nowrap}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}.howto{margin-top:44px;text-align:center;font-size:24px;font-style:italic;color:var(--gold-light)}
.opener header,.cover header{position:absolute;top:36px;left:48px;right:48px}.opener{display:flex;flex-direction:column;justify-content:center;text-align:center;background:radial-gradient(circle at 50% 30%,#16224d,var(--navy) 60%)}.opener-glyph{font-size:150px;line-height:1;color:var(--gold);opacity:.9;margin-top:10px}.opener-glyph.red{color:var(--coral)}
.numeral{font:11px var(--sans);letter-spacing:.4em;text-transform:uppercase;color:var(--gold);margin:28px 0 0}.display{font-size:54px;line-height:1.05;font-weight:600;color:var(--gold-light);text-wrap:balance;margin:14px auto 18px;max-width:640px}.opener .lead{margin:0 auto;font-size:25px;max-width:560px}
.asks{list-style:none;counter-reset:a;padding:0;margin:0 auto;max-width:520px;text-align:left}.asks li{counter-increment:a;display:flex;gap:16px;padding:10px 0;border-bottom:1px solid var(--line);font-size:21px}.asks li:before{content:counter(a,upper-roman);font:600 12px/2.2 var(--sans);color:var(--gold);min-width:22px}
.dossier-head{display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:start;margin-top:14px}.tiles{display:flex;gap:16px;align-items:flex-end}.tiles figure{margin:0;text-align:center}.tiles figcaption{font:9px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:10px}.archetype{font-size:32px;margin:0}
.dial{display:grid;grid-template-columns:1fr 1.25fr 1fr;border:1px solid var(--line);border-radius:4px}.dial>div{padding:14px 16px;font-size:16.5px;line-height:1.35}.dial>div+div{border-left:1px solid var(--line)}.dial small{display:block;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-size:9px}.dial .best{background:#d9b96816}.dial .best small{color:var(--gold)}.dial p{margin:6px 0 0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:30px}.two p{font-size:17px}.gifts{margin:0;padding-left:18px;font-size:17px}.gifts li{margin:3px 0}.gifts li::marker{color:var(--gold);content:'✦  '}
.rows{border-top:1px solid var(--line)}.row{display:grid;grid-template-columns:auto 1fr;gap:22px;padding:13px 0;border-bottom:1px solid var(--line);break-inside:avoid}.row p{margin:5px 0;font-size:17px}.row h3{margin:0 0 4px}.tight .row{padding:10px 0}.tight .row p{font-size:16.5px;margin:4px 0}
.verdict{border:1px solid var(--line);padding:22px 26px;margin-top:10px}.verdict b{font-size:26px;display:block}.verdict p{font-size:19px;margin:8px 0 0}
.timeline{position:relative;margin:34px 0 10px;padding-top:24px}.months{position:absolute;top:0;left:120px;right:0;height:20px}.months span{position:absolute;font:9px var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-left:1px solid var(--line);padding-left:4px;height:100%}
.lane{display:grid;grid-template-columns:120px 1fr;align-items:center;margin:14px 0}.lane p{margin:0;font-size:20px;color:var(--gold-light);font-weight:600}.lane p small{display:block;font-weight:400;color:var(--muted)}
.band{display:flex;height:58px;border-radius:4px;overflow:hidden;box-shadow:0 0 0 1px var(--line)}.band span{display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:0;overflow:hidden;color:#0b1430;border-right:1px solid var(--navy)}.band b{color:#0b1430;font-size:17px;line-height:1}.band span.narrow b{font-size:13px}.band span.narrow i{display:none}.band i{font:8px var(--sans);font-style:normal;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.today{position:absolute;top:22px;bottom:-14px;left:120px;border-left:2px solid var(--paper);padding-left:6px;font:9px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--paper);display:flex;align-items:flex-end}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;margin:30px 0 0;font-size:16px}.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}.legend small{color:var(--muted)}
.season{display:grid;grid-template-columns:52px 1fr auto;gap:18px;padding:14px 0 16px;border-bottom:1px solid var(--line);break-inside:avoid}.season-no{font-size:40px;font-weight:600;line-height:1}.season p{margin:5px 0;font-size:17px}.season .q{font-style:italic;color:var(--gold-light);font-size:18px}
.now{display:grid;grid-template-columns:auto 1fr;gap:28px;padding:16px 0;border-bottom:1px solid var(--line)}.now p{font-size:18px}.now.compact{padding:10px 0}.now.compact p{font-size:16.5px;margin:4px 0}.now.compact .meta{margin:2px 0 6px}.now.compact h3{font-size:22px}
.headline{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:center;padding:18px 0 22px;border-bottom:1px solid var(--line)}.headline .label{margin-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 30px}.cell{position:relative;padding:4px 60px 14px 0;border-bottom:1px solid var(--line)}.cell .tile{position:absolute;top:22px;right:0}.cell p{font-size:16.5px;margin:6px 0}.cell .gloss{font-size:15px}
.crossing{display:grid;grid-template-columns:78px 1fr auto;gap:20px;padding:16px 0;border-bottom:1px solid var(--line);break-inside:avoid}.crossing h3{font-size:22px}.crossing p{font-size:17px;margin:6px 0}.crossing .detail{font-size:15.5px;color:var(--muted);font-style:italic;margin:2px 0 6px}
.when{border-right:1px solid var(--line);padding-right:12px}.when b{display:block;font-size:22px;line-height:1.1}.when span{display:block;font-size:15px;color:var(--muted)}.when small{color:var(--muted)}.crossing.mine .when b{color:var(--gold-light)}.crossing.mine{background:linear-gradient(90deg,#d9b9680d,transparent 70%)}
.letter{display:grid;grid-template-columns:110px 1fr;gap:26px;margin-top:20px}.margin{border-right:1px solid var(--line);padding-right:20px;text-align:right}.margin b{display:block;font-size:64px;line-height:1;color:var(--gold);font-weight:400}.margin span{display:block;font:9px var(--sans);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-top:12px}.margin small{color:var(--muted);font-style:italic}
.personal-copy{font-size:19px;line-height:1.55}.personal-copy>div{min-height:1.55em}.personal-copy>div:first-child{color:#f1ead9;font-style:italic}
table{width:100%;border-collapse:collapse;font-size:16px;line-height:1.4}th,td{padding:12px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:var(--gold);font:600 10px var(--sans);letter-spacing:.14em;text-transform:uppercase}td .card-code{font-size:22px}.ledger td{font-size:16px;padding:9px 8px}.ledger td:first-child{white-space:nowrap}.ledger td small{color:var(--muted);font-size:13px;font-family:Cormorant,Georgia,serif}tr{break-inside:avoid}
@page{size:A4;margin:0}@media print{body{background:var(--navy);font-size:17px;print-color-adjust:exact;-webkit-print-color-adjust:exact}main{max-width:none}.page{min-height:296mm;padding:48px 48px 66px;margin:0}footer{left:48px;right:48px;bottom:24px}h1{font-size:52px}h2{font-size:34px}.cover h1{font-size:58px}.personal-copy{font-size:18px}th,td{padding:10px 7px}}
${[...usedFaces].map(code=>`.${faceClass(code)}{background-image:url('${cardFace(code)}')}`).join('')}
</style></head><body><main>${html.join('\n')}</main></body></html>`;
}
