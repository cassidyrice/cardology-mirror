// Presentation adapted from desktop/src/report-renderer.mjs; calculation stays on the Worker.
import {api, download, fileStem} from './session.mjs';
let OFFERS;
let revision=0;
const createDraft=fields=>({format:'card-blueprints-report',version:['timing-map','family','birth-card-blueprint'].includes(fields.offer)?3:2,...fields});
const $=id=>document.getElementById(id);
let documentResult=null,dirty=false,busy=false,sections=['','','',''],people=[],writingIndex=0,activeOffer='timing-map',sectionCache={};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const peopleCount=()=>$('offer').value==='family'?Number($('family-size').value):OFFERS[$('offer').value].people;
function collectPeople(){
  const count=peopleCount();
  const list=[{name:$('client-name').value,birthdate:$('report-birthdate').value,relation:'Buyer'}];
  for(let i=1;i<count;i++)list.push({name:$(`person-${i}-name`).value,birthdate:$(`person-${i}-birthdate`).value,relation:$(`person-${i}-relation`).value});
  return list;
}
const fields=()=>({offer:$('offer').value,readingDate:$('report-date').value,people:collectPeople(),sections:[...sections],notes:$('reader-notes').value,includeNotes:$('include-notes').checked,reviewed:$('reviewed').checked});
const status=text=>{$('report-status').textContent=text;};
function exportState(){for(const id of ['export-engine','export-html','save-pdf'])$(id).disabled=!documentResult||busy||(id==='export-engine'&&!documentResult?.engine);}
function invalidate(event){
  revision++;$('report-frame').srcdoc='';
  if(event?.target?.id!=='reviewed')$('reviewed').checked=false;
  dirty=true;documentResult=null;exportState();$('page-count').textContent='Preview out of date';
  $('report-page').disabled=true;$('preview-empty').hidden=false;
  $('notes-count').textContent=$('reader-notes').value.length.toLocaleString();
  $('report-error').textContent='';status('Unsaved changes. Update the preview before exporting.');
}
function addInput(container,id,label,type,value){
  const caption=document.createElement('label');caption.htmlFor=id;caption.textContent=label;
  const input=document.createElement('input');input.id=id;input.type=type;input.value=value||'';input.required=true;
  if(type==='text'){input.maxLength=60;input.autocomplete='off';}
  container.append(caption,input);
}
function renderPeople(){
  $('family-size-field').hidden=$('offer').value!=='family';
  const area=$('additional-people');area.replaceChildren();
  for(let i=1;i<peopleCount();i++){
    const p=people[i]||{},group=document.createElement('div');group.className='person-fields';
    const title=document.createElement('h3');title.textContent=`Person ${i+1}`;group.append(title);
    addInput(group,`person-${i}-name`,'Name','text',p.name);
    addInput(group,`person-${i}-relation`,'Relationship to buyer','text',p.relation);
    addInput(group,`person-${i}-birthdate`,'Birth date','date',p.birthdate);area.append(group);
  }
  const select=$('writing-section');select.replaceChildren();
  OFFERS[$('offer').value].sections.forEach((title,i)=>{const option=document.createElement('option');option.value=i;option.textContent=title;select.append(option);});
  writingIndex=0;select.value='0';$('section-copy').value=sections[0];
  const legacy=$('offer').value==='professional';select.disabled=legacy;$('section-copy').disabled=legacy;
}
function selectTab(writing){
  $('details-panel').hidden=writing;$('writing-panel').hidden=!writing;
  $('details-tab').setAttribute('aria-selected',String(!writing));$('writing-tab').setAttribute('aria-selected',String(writing));
}
$('details-tab').onclick=()=>selectTab(false);$('writing-tab').onclick=()=>selectTab(true);
$('section-copy').oninput=()=>{sections[writingIndex]=$('section-copy').value;};
$('writing-section').onchange=()=>{writingIndex=Number($('writing-section').value);$('section-copy').value=sections[writingIndex];};
function rememberPeople(){
  // Preserve filled slots across offer and Family size changes. collectPeople
  // includes only the active offer's count in requests and saved drafts.
  const current=[{name:$('client-name').value,birthdate:$('report-birthdate').value,relation:'Buyer'}];
  for(let i=1;$(`person-${i}-name`);i++)current.push({name:$(`person-${i}-name`).value,birthdate:$(`person-${i}-birthdate`).value,relation:$(`person-${i}-relation`).value});
  current.forEach((person,index)=>people[index]=person);
}
$('family-size').onchange=()=>{rememberPeople();renderPeople();invalidate();};
$('offer').onchange=()=>{
  rememberPeople();sectionCache[activeOffer]=[...sections];activeOffer=$('offer').value;sections=sectionCache[activeOffer]||['','','',''];renderPeople();invalidate();
};
async function preview(){
  const version=++revision;
  documentResult=null;exportState();$('report-frame').srcdoc='';
  $('report-page').disabled=true;$('preview-empty').hidden=false;
  status('Generating the report in your private workspace…');
  try {
    const next=await api('/api/report',fields());
    if(version!==revision)return;
    documentResult=next;$('report-error').textContent='';$('report-frame').srcdoc=next.html;
    $('preview-empty').hidden=true;exportState();status('Preview updated. Review each page before exporting.');
  } catch(error) {
    if(version!==revision)return;
    $('page-count').textContent='Preview unavailable';$('report-error').textContent=error.message;
    status('Your inputs are still in this tab. Correct the details or sign in again.');
  }
}
$('report-frame').addEventListener('load',()=>{
  if(!documentResult)return;const doc=$('report-frame').contentDocument;if(!doc)return;
  const style=doc.createElement('style');
  style.textContent='@media screen{main{width:850px;max-width:none;min-width:0!important}.page{margin:0 0 20px}body{overflow-x:hidden}}';doc.head.append(style);
  const select=$('report-page');select.replaceChildren();
  [...doc.querySelectorAll('.page')].forEach((page,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${index+1} · ${page.querySelector('h2').textContent}`;select.append(option);});
  $('page-count').textContent=`${select.options.length} pages`;select.disabled=false;resizePreview();
});
function resizePreview(){const doc=$('report-frame').contentDocument;if(doc?.querySelector('main'))doc.querySelector('main').style.zoom=String(Math.min(1,$('report-frame').clientWidth/850));}
new ResizeObserver(resizePreview).observe($('report-frame'));
$('report-page').onchange=()=>{$('report-frame').contentDocument.querySelectorAll('.page')[Number($('report-page').value)]?.scrollIntoView({block:'start'});};
$('report-form').addEventListener('input',event=>{if(event.target.id!=='writing-section')invalidate(event);});
$('report-form').onsubmit=event=>{event.preventDefault();if(OFFERS)void preview();};
async function fill(draft){
  revision++;
  $('offer').value=draft.offer;activeOffer=draft.offer;sectionCache={};people=draft.people;sections=[...draft.sections];
  if(draft.offer==='family')$('family-size').value=String(people.length);
  $('client-name').value=people[0].name;$('report-birthdate').value=people[0].birthdate;$('report-date').value=draft.readingDate;
  $('reader-notes').value=draft.notes;$('include-notes').checked=draft.includeNotes;$('reviewed').checked=draft.reviewed;
  $('notes-count').textContent=draft.notes.length.toLocaleString();renderPeople();selectTab(false);await preview();
}
async function sample(){dirty=false;await fill({offer:'timing-map',readingDate:today(),people:[{name:'Sample Client',birthdate:'1991-02-17',relation:'Buyer'}],sections:['','','',''],notes:'',includeNotes:true,reviewed:false});if(!dirty)status('Fictional sample. Replace the client’s details before preparing a reading.');}
$('load-sample').onclick=async()=>{if(dirty&&!confirm('Discard unsaved changes and load the sample?'))return;await sample();};
async function action(callback){if(busy)return;busy=true;exportState();try{await callback();}catch(error){status(`Could not complete the action: ${error.message}`);}finally{busy=false;exportState();}}
$('save-draft').onclick=()=>action(async()=>{
  const draft=createDraft(fields()),json=JSON.stringify(draft,null,2),name=`${fileStem(draft)}.draft.json`;
  download(json,name,'application/json');dirty=false;status('Draft downloaded. Open it here to continue editing.');
});
async function importDraft(text){
  if(text.length>200000)throw Error('This file is too large to be a report draft.');
  const version=++revision;
  const {draft}=await api('/api/draft',JSON.parse(text));
  if(version!==revision)return;
  dirty=false;await fill(draft);
  if(!dirty)status(documentResult?'Draft opened. Calculated cards were regenerated from the engine.':'Draft opened. Correct the highlighted details to generate a report.');
}
$('open-draft').onclick=()=>action(async()=>{
  if(dirty&&!confirm('Discard unsaved changes and open another draft?'))return;
  $('draft-file').value='';$('draft-file').click();
});
$('draft-file').onchange=()=>action(async()=>{const file=$('draft-file').files[0];if(!file)return;if(file.size>200000)throw Error('This file is too large to be a report draft.');await importDraft(await file.text());});
for(const [id,kind,suffix] of [['export-html','html','.html'],['export-engine','engine','.engine.json']])$(id).onclick=()=>action(async()=>{
  if(!documentResult)return;
  const name=`${fileStem(documentResult.draft)}${suffix}`,content=kind==='html'?documentResult.html:JSON.stringify(documentResult.engine,null,2);
  download(content,name,kind==='html'?'text/html':'application/json');
  status(`${kind==='html'?'HTML':'Engine JSON'} downloaded. Keep this private file somewhere safe.`);
});
$('save-pdf').onclick=()=>action(async()=>{
  if(!documentResult)return;
  const doc=$('report-frame').contentDocument,main=doc.querySelector('main'),zoom=main.style.zoom;main.style.zoom='1';try{$('report-frame').contentWindow.focus();$('report-frame').contentWindow.print();status('Print dialog opened. Choose Save as PDF, A4, with background graphics.');}finally{main.style.zoom=zoom;}
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});

window.addEventListener('private-session-expired',()=>{
  revision++;documentResult=null;exportState();$('report-frame').srcdoc='';
  $('report-page').disabled=true;$('preview-empty').hidden=false;
  $('page-count').textContent='Sign in to update preview';
});
window.addEventListener('private-signout',()=>{revision++;dirty=false;documentResult=null;people=[];sections=[];sectionCache={};$('report-form').reset();});
async function start(){
  const controls=['update-preview','save-draft','open-draft','load-sample'];
  $('report-form').inert=true;
  controls.forEach(id=>$(id).disabled=true);
  try {
    ({offers:OFFERS}=await api('/api/config'));
    $('report-date').value=today();renderPeople();
    $('report-form').inert=false;
    controls.forEach(id=>$(id).disabled=false);
    status('Enter client details or load the fictional sample. Download drafts before leaving.');
  }catch(error){status(error.message);}
}
void start();
